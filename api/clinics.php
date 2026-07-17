<?php
// api/clinics.php — GET list (?city=)
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $city = trim($_GET['city'] ?? '');
    $params = [];
    $sql = 'SELECT id, name, city, address, phone FROM clinics';
    if ($city !== '') {
        $sql .= ' WHERE city LIKE ?';
        $params[] = '%' . like_escape($city) . '%';
    }
    $sql .= ' ORDER BY city, name';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    send_json($stmt->fetchAll());
}

send_error('Endpoint clinics tidak ditemukan.', 404);
