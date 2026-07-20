<?php
// api/bookings.php — POST create, GET me, PATCH cancel
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// POST /api/bookings
if ($method === 'POST') {
    $user = require_login();
    if (empty($user['patientId'])) {
        send_error('Hanya akun pasien yang bisa membuat booking.', 403);
    }
    $body = get_json_body();
    $scheduleId = $body['scheduleId'] ?? null;
    $bookingDate = $body['bookingDate'] ?? null;
    $notes = $body['notes'] ?? null;

    if (!$scheduleId || !$bookingDate) {
        send_error('Jadwal dan tanggal booking wajib diisi.');
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'SELECT s.id, s.day_of_week, d.full_name AS doctor_name, c.name AS clinic_name
             FROM doctor_schedules s
             JOIN doctors d ON d.id = s.doctor_id
             JOIN clinics c ON c.id = s.clinic_id
             WHERE s.id = ? FOR UPDATE'
        );
        $stmt->execute([$scheduleId]);
        $schedule = $stmt->fetch();
        if (!$schedule) {
            send_error('Jadwal tidak ditemukan.', 404);
        }

        $jsDay = (int) date('w', strtotime($bookingDate . 'T00:00:00')); // 0=Minggu..6=Sabtu
        $isoDay = $jsDay === 0 ? 7 : $jsDay;
        if ($isoDay !== (int) $schedule['day_of_week']) {
            send_error('Tanggal yang dipilih tidak sesuai hari praktik dokter.');
        }

        $ins = $pdo->prepare(
            'INSERT INTO bookings (patient_id, schedule_id, booking_date, notes)
             VALUES (?, ?, ?, ?)'
        );
        $ins->execute([$user['patientId'], $scheduleId, $bookingDate, $notes ?: null]);
        $bookingId = $pdo->lastInsertId();
        $pdo->commit();

        send_json([
            'id' => (int) $bookingId,
            'status' => 'menunggu',
            'booking_date' => $bookingDate,
            'doctor_name' => $schedule['doctor_name'],
            'clinic_name' => $schedule['clinic_name'],
        ], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        if ($e instanceof PDOException && $e->getCode() === '23000') {
            send_error('Kamu sudah booking slot ini pada tanggal tersebut.', 409);
        }
        send_error('Gagal membuat booking.', 500);
    }
}

// GET /api/bookings/me
if ($method === 'GET' && ($_GET['action'] ?? '') === 'me') {
    $user = require_login();
    if (empty($user['patientId'])) {
        send_error('Hanya akun pasien yang punya riwayat booking.', 403);
    }
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT b.id, b.booking_date, b.status, b.notes,
                d.full_name AS doctor_name, d.specialization,
                c.name AS clinic_name, c.city AS clinic_city,
                s.start_time, s.end_time
         FROM bookings b
         JOIN doctor_schedules s ON s.id = b.schedule_id
         JOIN doctors d ON d.id = s.doctor_id
         JOIN clinics c ON c.id = s.clinic_id
         WHERE b.patient_id = ?
         ORDER BY b.booking_date DESC, s.start_time DESC'
    );
    $stmt->execute([$user['patientId']]);
    send_json($stmt->fetchAll());
}

// PATCH /api/bookings/:id/cancel
if ($method === 'PATCH' && isset($_GET['id']) && ($_GET['action'] ?? '') === 'cancel') {
    $user = require_login();
    $id = (int) $_GET['id'];
    $pdo = db();
    $stmt = $pdo->prepare(
        "UPDATE bookings SET status = 'dibatalkan'
         WHERE id = ? AND patient_id = ? AND status = 'menunggu'"
    );
    $stmt->execute([$id, $user['patientId']]);
    if ($stmt->rowCount() === 0) {
        send_error('Booking tidak ditemukan atau tidak bisa dibatalkan.', 404);
    }
    send_json(['id' => $id, 'status' => 'dibatalkan']);
}

send_error('Endpoint bookings tidak ditemukan.', 404);
