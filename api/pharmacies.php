<?php
// api/pharmacies.php — GET list (?city=) + GET catalog
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/pharmacies/:id/catalog
if ($method === 'GET' && isset($_GET['id']) && ($_GET['action'] ?? '') === 'catalog') {
    $id = (int) $_GET['id'];
    $stmt = db()->prepare(
        'SELECT m.id AS medicine_id, m.sku, m.name, cat.name AS category,
                ps.stock_qty, ps.price
         FROM pharmacy_stock ps
         JOIN medicines m ON m.id = ps.medicine_id
         LEFT JOIN medicine_categories cat ON cat.id = m.category_id
         WHERE ps.pharmacy_id = ?
         ORDER BY m.name'
    );
    $stmt->execute([$id]);
    send_json($stmt->fetchAll());
}

// GET /api/pharmacies?city=
if ($method === 'GET') {
    $city = trim($_GET['city'] ?? '');
    $params = [];
    $sql = 'SELECT id, name, city, address FROM pharmacies';
    if ($city !== '') {
        $sql .= ' WHERE city LIKE ?';
        $params[] = '%' . like_escape($city) . '%';
    }
    $sql .= ' ORDER BY city, name';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    send_json($stmt->fetchAll());
}

send_error('Endpoint pharmacies tidak ditemukan.', 404);
