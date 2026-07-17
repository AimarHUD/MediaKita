<?php
// api/doctors.php — GET list (filter) + GET schedules
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/doctors/:id/schedules
if ($method === 'GET' && isset($_GET['id']) && isset($_GET['schedules'])) {
    $doctorId = (int) $_GET['id'];
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT s.id, s.day_of_week, s.start_time, s.end_time,
                c.id AS clinic_id, c.name AS clinic_name, c.city AS clinic_city
         FROM doctor_schedules s
         JOIN clinics c ON c.id = s.clinic_id
         WHERE s.doctor_id = ?
         ORDER BY s.day_of_week, s.start_time'
    );
    $stmt->execute([$doctorId]);
    send_json($stmt->fetchAll());
}

// GET /api/doctors?search=&specialization=&city=
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $specialization = trim($_GET['specialization'] ?? '');
    $city = trim($_GET['city'] ?? '');

    $pdo = db();
    $sql = 'SELECT d.id, d.full_name, d.specialization, d.email, d.phone,
                   c.id AS clinic_id, c.name AS clinic_name, c.city AS clinic_city
            FROM doctors d
            LEFT JOIN doctor_clinics dc ON dc.doctor_id = d.id
            LEFT JOIN clinics c ON c.id = dc.clinic_id
            WHERE 1=1';
    $params = [];
    if ($search !== '') {
        $sql .= ' AND d.full_name LIKE ?';
        $params[] = '%' . like_escape($search) . '%';
    }
    if ($specialization !== '') {
        $sql .= ' AND d.specialization LIKE ?';
        $params[] = '%' . like_escape($specialization) . '%';
    }
    if ($city !== '') {
        $sql .= ' AND EXISTS (
            SELECT 1 FROM doctor_clinics dc2
            JOIN clinics c2 ON c2.id = dc2.clinic_id
            WHERE dc2.doctor_id = d.id AND c2.city LIKE ?
        )';
        $params[] = '%' . like_escape($city) . '%';
    }
    $sql .= ' ORDER BY d.full_name';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Group clinics per doctor (replaces PostgreSQL json_agg ... FILTER).
    $doctors = [];
    foreach ($rows as $r) {
        $id = (int) $r['id'];
        if (!isset($doctors[$id])) {
            $doctors[$id] = [
                'id' => $id,
                'full_name' => $r['full_name'],
                'specialization' => $r['specialization'],
                'email' => $r['email'],
                'phone' => $r['phone'],
                'clinics' => [],
            ];
        }
        if ($r['clinic_id'] !== null) {
            $doctors[$id]['clinics'][] = [
                'id' => (int) $r['clinic_id'],
                'name' => $r['clinic_name'],
                'city' => $r['clinic_city'],
            ];
        }
    }
    send_json(array_values($doctors));
}

send_error('Endpoint doctors tidak ditemukan.', 404);
