<?php
/**
 * API для работы с избранным
 * JAPAN TRUCK
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Файл для хранения избранного (в реальном проекте - база данных)
$favoritesFile = __DIR__ . '/data/favorites.json';

// Создаем директорию если не существует
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

// Получение избранного
function getFavorites($userId = 'guest') {
    global $favoritesFile;
    
    if (!file_exists($favoritesFile)) {
        return [];
    }
    
    $data = json_decode(file_get_contents($favoritesFile), true) ?: [];
    return $data[$userId] ?? [];
}

// Добавление в избранное
function addFavorite($userId, $productId) {
    global $favoritesFile;
    
    $data = file_exists($favoritesFile) 
        ? json_decode(file_get_contents($favoritesFile), true) ?: []
        : [];
    
    if (!isset($data[$userId])) {
        $data[$userId] = [];
    }
    
    if (!in_array($productId, $data[$userId])) {
        $data[$userId][] = $productId;
        file_put_contents($favoritesFile, json_encode($data, JSON_PRETTY_PRINT));
        return true;
    }
    
    return false;
}

// Удаление из избранного
function removeFavorite($userId, $productId) {
    global $favoritesFile;
    
    if (!file_exists($favoritesFile)) {
        return false;
    }
    
    $data = json_decode(file_get_contents($favoritesFile), true) ?: [];
    
    if (isset($data[$userId])) {
        $key = array_search($productId, $data[$userId]);
        if ($key !== false) {
            unset($data[$userId][$key]);
            $data[$userId] = array_values($data[$userId]);
            file_put_contents($favoritesFile, json_encode($data, JSON_PRETTY_PRINT));
            return true;
        }
    }
    
    return false;
}

// Основная логика
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $userId = $_GET['user_id'] ?? 'guest';
    
    switch ($method) {
        case 'GET':
            $favorites = getFavorites($userId);
            echo json_encode([
                'success' => true,
                'favorites' => $favorites
            ]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $productId = $input['product_id'] ?? null;
            
            if (!$productId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'product_id обязателен']);
                exit;
            }
            
            $added = addFavorite($userId, $productId);
            echo json_encode([
                'success' => true,
                'action' => $added ? 'added' : 'already_exists',
                'message' => $added ? 'Добавлено в избранное' : 'Уже в избранном'
            ]);
            break;
            
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            $productId = $input['product_id'] ?? $_GET['product_id'] ?? null;
            
            if (!$productId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'product_id обязателен']);
                exit;
            }
            
            $removed = removeFavorite($userId, $productId);
            echo json_encode([
                'success' => true,
                'action' => $removed ? 'removed' : 'not_found',
                'message' => $removed ? 'Удалено из избранного' : 'Не найдено в избранном'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Метод не поддерживается']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>