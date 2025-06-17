<?php
header('Content-Type: application/json');

session_start();

// Récupère les données POST
$data = json_decode(file_get_contents('php://input'), true);
$login = $data['login'] ?? '';
$password = $data['password'] ?? '';

if ($login === 'admin' && $password === 'admin') {
    $_SESSION['is_admin'] = true;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Identifiant ou mot de passe incorrect.']);
}
