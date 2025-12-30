<?php
/**
 * API для смены пароля администратора
 * JAPAN TRUCK
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Файл для хранения хэша пароля
$passwordFile = __DIR__ . '/data/admin_password.json';
$logsFile = __DIR__ . '/data/admin_logs.json';

// Создаем директорию
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

// Простая функция хэширования (в реальном проекте используйте password_hash)
function simpleHash($password) {
    return hash('sha256', $password . 'japan_truck_salt_2024');
}

// Логирование
function logAction($action, $ip = null) {
    global $logsFile;
    
    $logs = file_exists($logsFile) 
        ? json_decode(file_get_contents($logsFile), true) ?: []
        : [];
    
    $logs[] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'action' => $action,
        'ip' => $ip ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    // Храним только последние 1000 записей
    if (count($logs) > 1000) {
        $logs = array_slice($logs, -1000);
    }
    
    file_put_contents($logsFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Проверка текущего пароля
function checkPassword($password) {
    global $passwordFile;
    
    if (!file_exists($passwordFile)) {
        return true; // Первый вход
    }
    
    $data = json_decode(file_get_contents($passwordFile), true);
    return $data['hash'] === simpleHash($password);
}

// Установка нового пароля
function setPassword($password) {
    global $passwordFile;
    
    $data = [
        'hash' => simpleHash($password),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    return file_put_contents($passwordFile, json_encode($data, JSON_PRETTY_PRINT));
}

// Основная логика
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Только POST запросы']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $currentPassword = $input['current_password'] ?? null;
    $newPassword = $input['new_password'] ?? null;
    
    if (!$currentPassword || !$newPassword) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Укажите текущий и новый пароль']);
        exit;
    }
    
    if (strlen($newPassword) < 4) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Пароль должен быть минимум 4 символа']);
        exit;
    }
    
    if (!checkPassword($currentPassword)) {
        logAction('Неудачная попытка смены пароля - неверный текущий пароль');
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Неверный текущий пароль']);
        exit;
    }
    
    if (setPassword($newPassword)) {
        logAction('Пароль администратора успешно изменён');
        echo json_encode([
            'success' => true,
            'message' => 'Пароль успешно изменён'
        ]);
    } else {
        throw new Exception('Ошибка сохранения пароля');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>