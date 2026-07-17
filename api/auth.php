<?php
// api/auth.php — register / login / me / logout
require_once __DIR__ . '/../config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && $action === 'register') {
    $body = get_json_body();
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $fullName = trim($body['fullName'] ?? '');
    $dateOfBirth = $body['dateOfBirth'] ?? null;
    $phone = $body['phone'] ?? null;

    if (!$email || !$password || !$fullName) {
        send_error('Email, password, dan nama lengkap wajib diisi.');
    }
    if (strlen($password) < 6) {
        send_error('Password minimal 6 karakter.');
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $check->execute([$email]);
        if ($check->fetch()) {
            send_error('Email sudah terdaftar.', 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        $insUser = $pdo->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'patient')");
        $insUser->execute([$email, $hash]);
        $userId = $pdo->lastInsertId();

        $insPatient = $pdo->prepare('INSERT INTO patients (user_id, full_name, date_of_birth, phone) VALUES (?, ?, ?, ?)');
        $insPatient->execute([$userId, $fullName, $dateOfBirth ?: null, $phone ?: null]);
        $patientId = $pdo->lastInsertId();

        $pdo->commit();

        $_SESSION['user'] = [
            'id' => (int) $userId,
            'patientId' => (int) $patientId,
            'email' => $email,
            'role' => 'patient',
            'fullName' => $fullName,
        ];

        send_json([
            'user' => ['email' => $email, 'role' => 'patient', 'fullName' => $fullName],
        ], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        send_error('Registrasi gagal, coba lagi.', 500);
    }
}

if ($method === 'POST' && $action === 'login') {
    $body = get_json_body();
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';
    if (!$email || !$password) {
        send_error('Email dan password wajib diisi.');
    }

    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.password_hash, u.role, p.id AS patient_id, p.full_name
         FROM users u LEFT JOIN patients p ON p.user_id = u.id
         WHERE u.email = ?'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        send_error('Email atau password salah.', 401);
    }

    $_SESSION['user'] = [
        'id' => (int) $user['id'],
        'patientId' => $user['patient_id'] ? (int) $user['patient_id'] : null,
        'email' => $user['email'],
        'role' => $user['role'],
        'fullName' => $user['full_name'] ?: 'Admin',
    ];

    send_json([
        'user' => [
            'email' => $user['email'],
            'role' => $user['role'],
            'fullName' => $user['full_name'] ?: 'Admin',
        ],
    ]);
}

if ($method === 'GET' && $action === 'me') {
    $user = current_user();
    if (!$user) {
        send_json(['user' => null]);
    }
    send_json(['user' => $user]);
}

if ($method === 'POST' && $action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    send_json(['ok' => true]);
}

send_error('Endpoint auth tidak ditemukan.', 404);
