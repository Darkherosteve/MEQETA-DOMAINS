<?php
header("Content-Type: application/json");

$route = $_GET['route'] ?? '';

switch ($route) {

    case 'settings':
        require_once __DIR__ . '/settings.php';
        break;

    case 'availability':
        require_once __DIR__ . '/availability.php';
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Invalid route"]);
        break;
}