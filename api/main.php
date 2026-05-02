<?php
// API Main File
// Minions Enterprises Solutions Lati System
header('Content-Type: application/json');

$settings = json_decode(file_get_contents(__DIR__ . '/../data/setting.json'), true);
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    respond(['error' => 'Invalid input']);
}

$action = $input['action'] ?? '';

switch ($action) {
    case 'check_domain':
        $query = trim($input['domain'] ?? '');
        if (!$query) {
            respond(['message' => 'Domain is required']);
        }

        $label = normalizeDomainLabel($query);
        if (!$label) {
            respond(['message' => 'Enter a valid domain label']);
        }

        $tldSettings = $settings['domain_tlds'] ?? getDefaultTlds();
        $tlds = array_keys($tldSettings);
        $domains = buildDomainList($label, $tlds);

        $token = $settings['api']['hostinger_token'] ?? '';
        $hostingerResult = null;
        if ($token) {
            $hostingerResult = checkHostingerDomains($domains, $token);
        }

        $records = [];
        $hostingerMap = [];
        if ($hostingerResult && $hostingerResult['ok']) {
            $hostingerMap = $hostingerResult['data'];
        }

        foreach ($domains as $domain) {
            if (isset($hostingerMap[$domain])) {
                $records[] = buildRecord($domain, $hostingerMap[$domain], 'hostinger', $settings);
                continue;
            }

            $fallback = checkRdapAvailability($domain);
            if ($fallback['ok']) {
                $records[] = buildRecord($domain, $fallback['available'], 'fallback', $settings);
            } else {
                $records[] = buildRecord($domain, false, 'unknown', $settings);
            }
        }

        respond([
            'message' => 'Domain availability results for ' . $label,
            'domain' => $label,
            'records' => $records
        ]);
        break;

    case 'set_margin':
        $margin = $input['margin'] ?? '';
        if (!is_numeric($margin)) {
            respond(['message' => 'Invalid margin']);
        }
        $settings['margins']['default'] = (float)$margin;
        file_put_contents(__DIR__ . '/../data/setting.json', json_encode($settings, JSON_PRETTY_PRINT));
        respond(['message' => 'Margin set to ' . $margin . '%']);
        break;

    default:
        respond(['error' => 'Unknown action']);
}

function respond(array $payload) {
    echo json_encode($payload);
    exit;
}

function normalizeDomainLabel(string $input): string {
    $label = strtolower(trim($input));
    $label = preg_replace('/^www\./', '', $label);
    if (strpos($label, '.') !== false) {
        $parts = explode('.', $label);
        $label = $parts[0];
    }
    $label = preg_replace('/[^a-z0-9-]/', '', $label);
    $label = trim($label, '-');
    return $label;
}

function buildDomainList(string $label, array $tlds): array {
    return array_map(fn($tld) => $label . '.' . $tld, $tlds);
}

function getDefaultTlds(): array {
    return [
        'com' => ['price' => 12.99],
        'net' => ['price' => 10.99],
        'org' => ['price' => 11.99],
        'co' => ['price' => 20.99],
        'app' => ['price' => 4.99],
        'online' => ['price' => 2.99],
        'tech' => ['price' => 5.99],
        'store' => ['price' => 5.49],
        'io' => ['price' => 39.99],
    ];
}

function buildRecord(string $domain, bool $available, string $source, array $settings): array {
    $tld = strtolower(substr(strrchr($domain, '.'), 1));
    $tldSettings = $settings['domain_tlds'] ?? getDefaultTlds();
    $price = $tldSettings[$tld]['price'] ?? null;
    $margin = $settings['margins']['default'] ?? 0;
    $salePrice = $price !== null ? round($price * (1 + $margin / 100), 2) : null;

    return [
        'domain' => $domain,
        'available' => $available,
        'source' => $source,
        'price' => $price !== null ? formatCurrency($price) : null,
        'sale_price' => $salePrice !== null ? formatCurrency($salePrice) : null,
    ];
}

function formatCurrency(float $amount): string {
    return '$' . number_format($amount, 2);
}

function requestUrl(string $url, array $headers = [], string $payload = null): array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_USERAGENT, 'MEQTEADOMAINS/1.0');
    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status' => $httpStatus,
        'response' => $response,
        'error' => $curlError,
    ];
}

function checkHostingerDomains(array $domains, string $token): array {
    if (empty($domains)) {
        return ['ok' => false, 'details' => 'No domains provided to Hostinger check'];
    }

    $url = 'https://api.hostinger.com/api/domains/v1/availability';
    $payload = json_encode(['domains' => $domains]);
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
    ];

    $result = requestUrl($url, $headers, $payload);
    if ($result['response'] === false) {
        return ['ok' => false, 'details' => $result['error'] ?: 'No response from Hostinger'];
    }

    $data = json_decode($result['response'], true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['ok' => false, 'details' => $result['response']];
    }

    if ($result['status'] < 200 || $result['status'] >= 300) {
        return ['ok' => false, 'details' => [
            'status' => $result['status'],
            'response' => $data,
        ]];
    }

    $available = [];
    foreach ($domains as $domain) {
        if (isset($data['domains'][$domain]['available'])) {
            $available[$domain] = (bool)$data['domains'][$domain]['available'];
        } elseif (isset($data[$domain]['available'])) {
            $available[$domain] = (bool)$data[$domain]['available'];
        }
    }

    return ['ok' => true, 'data' => $available];
}

function checkRdapAvailability(string $domain): array {
    $url = 'https://rdap.org/domain/' . rawurlencode($domain);
    $result = requestUrl($url, ['Accept: application/json']);
    if ($result['response'] === false) {
        return ['ok' => false, 'details' => $result['error'] ?: 'No RDAP response'];
    }

    if ($result['status'] === 404) {
        return ['ok' => true, 'available' => true];
    }

    if ($result['status'] >= 200 && $result['status'] < 300) {
        return ['ok' => true, 'available' => false];
    }

    return ['ok' => false, 'details' => [
        'status' => $result['status'],
        'response' => $result['response'],
    ]];
}
?>
