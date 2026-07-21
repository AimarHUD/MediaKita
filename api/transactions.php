<?php
// api/transactions.php — POST create, GET me
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// POST /api/transactions
if ($method === 'POST') {
    $user = require_login();
    if (empty($user['patientId'])) {
        send_error('Hanya akun pasien yang bisa membeli obat.', 403);
    }
    $body = get_json_body();
    $pharmacyId = $body['pharmacyId'] ?? null;
    $items = $body['items'] ?? [];
    if (!$pharmacyId || !is_array($items) || count($items) === 0) {
        send_error('Apotek dan minimal satu item wajib diisi.');
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $total = 0;
        $lineItems = [];

        $stockStmt = $pdo->prepare(
            'SELECT ps.stock_qty, ps.price, m.id AS medicine_id, m.sku
             FROM pharmacy_stock ps
             JOIN medicines m ON m.id = ps.medicine_id
             WHERE ps.pharmacy_id = ? AND ps.medicine_id = ?
             FOR UPDATE'
        );

        foreach ($items as $item) {
            $stockStmt->execute([$pharmacyId, $item['medicineId']]);
            $stock = $stockStmt->fetch();
            if (!$stock) {
                throw new Exception('Obat tidak tersedia di apotek ini.', 404);
            }
            $qty = (int) ($item['quantity'] ?? 0);
            if ($qty <= 0) {
                throw new Exception('Jumlah pembelian harus lebih dari 0.', 400);
            }
            if ((int) $stock['stock_qty'] < $qty) {
                throw new Exception("Stok {$stock['sku']} tidak cukup (tersisa {$stock['stock_qty']}).", 409);
            }
            $subtotal = (float) $stock['price'] * $qty;
            $total += $subtotal;
            $lineItems[] = [
                'medicineId' => (int) $stock['medicine_id'],
                'sku' => $stock['sku'],
                'price' => (float) $stock['price'],
                'qty' => $qty,
            ];
        }

        $txStmt = $pdo->prepare('INSERT INTO transactions (patient_id, pharmacy_id, total_price) VALUES (?, ?, ?)');
        $txStmt->execute([$user['patientId'], $pharmacyId, $total]);
        $txId = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare(
            'INSERT INTO transaction_items (transaction_id, medicine_id, sku_at_purchase, price_at_purchase, quantity)
             VALUES (?, ?, ?, ?, ?)'
        );
        $updStmt = $pdo->prepare(
            'UPDATE pharmacy_stock SET stock_qty = stock_qty - ?, updated_at = NOW()
             WHERE pharmacy_id = ? AND medicine_id = ?'
        );
        foreach ($lineItems as $li) {
            $itemStmt->execute([$txId, $li['medicineId'], $li['sku'], $li['price'], $li['qty']]);
            $updStmt->execute([$li['qty'], $pharmacyId, $li['medicineId']]);
        }

        $pdo->commit();
        send_json(['id' => (int) $txId, 'totalPrice' => $total, 'createdAt' => date('Y-m-d H:i:s')], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        $code = method_exists($e, 'getCode') && is_int($e->getCode()) && $e->getCode() >= 400 ? $e->getCode() : 500;
        send_error($e->getMessage(), $code === 0 ? 500 : $code);
    }
}

// GET /api/transactions/me
if ($method === 'GET' && ($_GET['action'] ?? '') === 'me') {
    $user = require_login();
    if (empty($user['patientId'])) {
        send_error('Hanya akun pasien yang punya riwayat transaksi.', 403);
    }
    $pdo = db();
    $txStmt = $pdo->prepare(
        'SELECT t.id, t.total_price, t.created_at, p.name AS pharmacy_name, p.city AS pharmacy_city
         FROM transactions t
         JOIN pharmacies p ON p.id = t.pharmacy_id
         WHERE t.patient_id = ?
         ORDER BY t.created_at DESC'
    );
    $txStmt->execute([$user['patientId']]);
    $transactions = $txStmt->fetchAll();
    if (count($transactions) === 0) {
        send_json([]);
    }

    $ids = array_map(fn($t) => $t['id'], $transactions);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $itemStmt = $pdo->prepare(
        "SELECT ti.transaction_id, ti.sku_at_purchase, ti.price_at_purchase, ti.quantity,
                (ti.price_at_purchase * ti.quantity) AS subtotal, m.name AS medicine_name
         FROM transaction_items ti
         JOIN medicines m ON m.id = ti.medicine_id
         WHERE ti.transaction_id IN ($placeholders)
         ORDER BY ti.id"
    );
    $itemStmt->execute($ids);
    $itemsByTx = [];
    foreach ($itemStmt->fetchAll() as $it) {
        $itemsByTx[$it['transaction_id']][] = $it;
    }

    foreach ($transactions as &$t) {
        $t['items'] = $itemsByTx[$t['id']] ?? [];
    }
    send_json($transactions);
}

send_error('Endpoint transactions tidak ditemukan.', 404);
