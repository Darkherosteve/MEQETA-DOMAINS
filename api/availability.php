<?php
header("Content-Type: application/json");

/* ========================
   INPUT
======================== */
$input = json_decode(file_get_contents("php://input"), true);
$base = $input['base'] ?? '';

if (!$base) {
    echo json_encode(["error" => "Base domain required"]);
    exit;
}

// Validate domain name
if (!preg_match('/^[a-z0-9-]+$/i', $base)) {
    echo json_encode(["error" => "Invalid domain name. Use only letters, numbers, and hyphens"]);
    exit;
}

/* ========================
   POPULAR TLDS ONLY
======================== */
$tlds = [
    ".com",   // Most popular
    ".in",    // India
    ".tech",  // Tech focused
    ".app",   // Apps
    ".dev",   // Developers
    ".io",    // Tech/Startups
    ".ai",    // AI focused
    ".co",    // Companies
    ".org",   // Organizations
    ".net",   // Networks
    ".xyz",   // Modern
    ".online" // General
];

/* ========================
   FUNCTION: Check domain via WHOIS
======================== */
function checkDomainAvailability($domain) {
    $domain = strtolower(trim($domain));
    $whoisServer = getWhoisServer($domain);
    
    if (!$whoisServer) {
        return null;
    }
    
    $fp = @fsockopen($whoisServer, 43, $errno, $errstr, 10);
    if (!$fp) {
        return null;
    }
    
    fwrite($fp, $domain . "\r\n");
    $response = '';
    while (!feof($fp)) {
        $response .= fgets($fp, 128);
    }
    fclose($fp);
    
    // Check if domain is available
    $notFoundIndicators = [
        'No match', 'NOT FOUND', 'No entries found',
        'Domain not found', 'is available', 'no data found',
        'Status: free', 'AVAILABLE', 'Not registered',
        'No object found', 'does not exist', 'is free'
    ];
    
    foreach ($notFoundIndicators as $indicator) {
        if (stripos($response, $indicator) !== false) {
            return true;
        }
    }
    
    // For .com/.net verisign
    if (stripos($response, 'Domain Name:') === false && stripos($response, 'Registrar:') === false) {
        return true;
    }
    
    return false;
}

function getWhoisServer($domain) {
    $tld = substr($domain, strrpos($domain, '.'));
    
    $servers = [
        '.com' => 'whois.verisign-grs.com',
        '.net' => 'whois.verisign-grs.com',
        '.org' => 'whois.pir.org',
        '.co' => 'whois.nic.co',
        '.io' => 'whois.nic.io',
        '.ai' => 'whois.nic.ai',
        '.app' => 'whois.nic.google',
        '.dev' => 'whois.nic.google',
        '.xyz' => 'whois.nic.xyz',
        '.online' => 'whois.nic.online',
        '.tech' => 'whois.nic.tech',
        '.in' => 'whois.registry.in',
    ];
    
    return $servers[$tld] ?? null;
}

/* ========================
   CHECK ALL DOMAINS
======================== */
$output = [];

foreach ($tlds as $tld) {
    $domain = $base . $tld;
    
    // Check availability via WHOIS
    $available = checkDomainAvailability($domain);
    
    $output[$domain] = [
        "available" => $available === true
    ];
    
    // Small delay to avoid rate limiting
    usleep(150000);
}

echo json_encode($output);
?>