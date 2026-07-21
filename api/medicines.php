<?php
// api/medicines.php — list, categories, stock, admin CRUD
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/medicines/categories
if ($method === 'GET' && ($_GET['action'] ?? '') === 'categories') {
    $stmt = db()->prepare('SELECT id, name FROM medicine_categories ORDER BY name');
    $stmt->execute();
    send_json($stmt->fetchAll());
}

// GET /api/medicines/:id/stock
if ($method === 'GET' && isset($_GET['id']) && ($_GET['action'] ?? '') === 'stock') {
    $id = (int) $_GET['id'];
    $stmt = db()->prepare(
        'SELECT p.id AS pharmacy_id, p.name AS pharmacy_name, p.city, p.image_url, ps.stock_qty, ps.price
         FROM pharmacy_stock ps
         JOIN pharmacies p ON p.id = ps.pharmacy_id
         WHERE ps.medicine_id = ? AND ps.stock_qty > 0
         ORDER BY ps.price ASC'
    );
    $stmt->execute([$id]);
    send_json($stmt->fetchAll());
}

// GET /api/medicines/:id/prescriptions — hospitals that prescribed this medicine
if ($method === 'GET' && isset($_GET['id']) && ($_GET['action'] ?? '') === 'prescriptions') {
    $id = (int) $_GET['id'];
    $stmt = db()->prepare(
        'SELECT DISTINCT c.id AS clinic_id, c.name AS clinic_name, c.city AS clinic_city, c.address AS clinic_address
         FROM prescriptions pr
         JOIN medical_records mr ON mr.id = pr.medical_record_id
         JOIN bookings b ON b.id = mr.booking_id
         JOIN doctor_schedules ds ON ds.id = b.schedule_id
         JOIN clinics c ON c.id = ds.clinic_id
         WHERE pr.medicine_id = ?
         ORDER BY c.name'
    );
    $stmt->execute([$id]);
    send_json($stmt->fetchAll());
}

// GET /api/medicines
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $category = trim($_GET['category'] ?? '');
    $minPrice = trim($_GET['minPrice'] ?? '');
    $maxPrice = trim($_GET['maxPrice'] ?? '');

    $params = [];
    $sql = 'SELECT m.id, m.sku, m.name, m.description,
                   cat.name AS category,
                   MIN(ps.price) AS lowest_price,
                   COALESCE(SUM(ps.stock_qty), 0) AS total_stock
            FROM medicines m
            LEFT JOIN medicine_categories cat ON cat.id = m.category_id
            LEFT JOIN pharmacy_stock ps ON ps.medicine_id = m.id
            WHERE 1=1';
    if ($search !== '') {
        $sql .= ' AND m.name LIKE ?';
        $params[] = '%' . like_escape($search) . '%';
    }
    if ($category !== '') {
        $sql .= ' AND cat.name LIKE ?';
        $params[] = '%' . like_escape($category) . '%';
    }
    $sql .= ' GROUP BY m.id, m.sku, m.name, m.description, cat.name';
    $havings = [];
    if ($minPrice !== '') {
        $havings[] = 'MIN(ps.price) >= ?';
        $params[] = $minPrice;
    }
    if ($maxPrice !== '') {
        $havings[] = 'MIN(ps.price) <= ?';
        $params[] = $maxPrice;
    }
    if ($havings) {
        $sql .= ' HAVING ' . implode(' AND ', $havings);
    }
    $sql .= ' ORDER BY m.name';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    send_json($stmt->fetchAll());
}

// POST /api/medicines (admin)
if ($method === 'POST') {
    $user = require_admin();
    $body = get_json_body();
    $sku = trim($body['sku'] ?? '');
    $name = trim($body['name'] ?? '');
    $description = $body['description'] ?? null;
    $categoryId = $body['categoryId'] ?? null;
    if (!$sku || !$name) {
        send_error('SKU dan nama obat wajib diisi.');
    }
    $pdo = db();
    try {
        $stmt = $pdo->prepare('INSERT INTO medicines (sku, name, description, category_id) VALUES (?, ?, ?, ?)');
        $stmt->execute([$sku, $name, $description ?: null, $categoryId ?: null]);
        $id = $pdo->lastInsertId();
        $sel = $pdo->prepare('SELECT * FROM medicines WHERE id = ?');
        $sel->execute([$id]);
        send_json($sel->fetch(), 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            send_error('SKU sudah dipakai obat lain.', 409);
        }
        send_error('Gagal menambah obat.', 500);
    }
}

// PUT /api/medicines/:id
if ($method === 'PUT' && isset($_GET['id'])) {
    $user = require_admin();
    $id = (int) $_GET['id'];
    $body = get_json_body();
    $pdo = db();
    $stmt = $pdo->prepare(
        'UPDATE medicines SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                category_id = COALESCE(?, category_id)
         WHERE id = ?'
    );
    $stmt->execute([
        $body['name'] ?? null,
        $body['description'] ?? null,
        $body['categoryId'] ?? null,
        $id,
    ]);
    if ($stmt->rowCount() === 0) {
        send_error('Obat tidak ditemukan.', 404);
    }
    $sel = $pdo->prepare('SELECT * FROM medicines WHERE id = ?');
    $sel->execute([$id]);
    send_json($sel->fetch());
}

// DELETE /api/medicines/:id
if ($method === 'DELETE' && isset($_GET['id'])) {
    $user = require_admin();
    $id = (int) $_GET['id'];
    $stmt = db()->prepare('DELETE FROM medicines WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        send_error('Obat tidak ditemukan.', 404);
    }
    http_response_code(204);
    exit;
}

// PUT /api/medicines/:id/stock/:pharmacyId (admin)
if ($method === 'PUT' && isset($_GET['id']) && isset($_GET['pharmacyId'])) {
    $user = require_admin();
    $medicineId = (int) $_GET['id'];
    $pharmacyId = (int) $_GET['pharmacyId'];
    $body = get_json_body();
    $stockQty = $body['stockQty'] ?? null;
    $price = $body['price'] ?? null;
    $pdo = db();
    $stmt = $pdo->prepare(
        'INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, stock_qty, price, updated_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE stock_qty = VALUES(stock_qty), price = VALUES(price), updated_at = NOW()'
    );
    $stmt->execute([$pharmacyId, $medicineId, $stockQty, $price]);
    $sel = $pdo->prepare('SELECT * FROM pharmacy_stock WHERE pharmacy_id = ? AND medicine_id = ?');
    $sel->execute([$pharmacyId, $medicineId]);
    send_json($sel->fetch());
}

send_error('Endpoint medicines tidak ditemukan.', 404);
