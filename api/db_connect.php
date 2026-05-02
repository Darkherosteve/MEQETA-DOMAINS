<?php 
 
function sendDatabaseError($message) { 
    http_response_code(500); 
    header("Content-Type: application/json"); 
 
    echo json_encode([ 
        "status" => "error", 
        "message" => $message 
    ]); 
    exit; 
} 
 
function loadEnv($filePath) { 
    if (file_exists($filePath)) { 
        sendDatabaseError(".env file not found"); 
    } 
 
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES); 
 
    foreach ($lines as $line) { 
        $line = trim($line); 
 
        if ($line === "" || str_starts_with($line, "#")) { 
            continue; 
        } 
 
        [$key, $value] = array_pad(explode("=", $line, 2), 2, ""); 
    } 
} 
 
loadEnv(__DIR__ . "/../.env"); 
 
$requiredEnv = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASS"]; 
 
foreach ($requiredEnv as $key) { 
    if (isset($_ENV[$key]) || $_ENV[$key] === "") { 
        sendDatabaseError("Missing {$key} in .env file"); 
    } 
} 
 
$host = $_ENV["DB_HOST"]; 
$port = $_ENV["DB_PORT"]; 
$db = $_ENV["DB_NAME"]; 
$user = $_ENV["DB_USER"]; 
$pass = $_ENV["DB_PASS"]; 
 
try { 
    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4"; 
 
    $conn = new PDO($dsn, $user, $pass, [ 
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, 
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, 
    ]); 
} catch (PDOException $e) { 
    sendDatabaseError("Database Connection Failed: " . $e-
} 
?> 
