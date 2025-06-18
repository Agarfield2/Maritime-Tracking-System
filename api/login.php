<?php
header('Content-Type: application/json');
require_once 'jwt_functions.php';

// Vérifier si la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit();
}

// Récupérer les données POST
$data = json_decode(file_get_contents('php://input'), true);
$login = $data['login'] ?? '';
$password = $data['password'] ?? '';

// Validation des entrées
if (empty($login) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Tous les champs sont requis']);
    exit();
}

// Vérification des identifiants
$valid_username = 'admin';
$valid_password = 'admin'; // En production, utilisez password_hash() et password_verify()

if ($login === $valid_username && $password === $valid_password) {
    // Authentification réussie - générer un token JWT
    setAuthCookie(1, 'admin'); // ID utilisateur 1 pour l'admin
    
    echo json_encode([
        'success' => true,
        'redirect' => 'admin.html'
    ]);
} else {
    // Répondre avec un délai pour empêcher les attaques par force brute
    sleep(2);
    
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'error' => 'Identifiant ou mot de passe incorrect.'
    ]);
}
