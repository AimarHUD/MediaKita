<?php
// config.php — MediKita shared bootstrap (DB + session + helpers)
session_start();

// --- Database configuration (XAMPP MySQL defaults) ---
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'eterna_care');
define('DB_USER', 'root');
define('DB_PASS', '');

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function send_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function send_error(string $message, int $status = 400): void
{
    send_json(['error' => $message], $status);
}

function get_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return [];
    }
    return $data;
}

// --- Session-based auth helpers ---
function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        send_error('Silakan login terlebih dahulu.', 401);
    }
    return $user;
}

function require_admin(): array
{
    $user = require_login();
    if (($user['role'] ?? '') !== 'admin') {
        send_error('Hanya admin yang boleh mengakses ini.', 403);
    }
    return $user;
}

// Escape a string for safe use inside a MySQL LIKE pattern.
function like_escape(string $value): string
{
    return addcslashes($value, '%_\\');
}
