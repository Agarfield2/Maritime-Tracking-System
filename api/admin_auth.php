<?php
require_once 'jwt_functions.php';

// Vérifier si l'utilisateur est authentifié
if (!isLoggedIn()) {
    http_response_code(401);
    header('Location: /tpapache/Projet_web3/login.html?redirect=' . urlencode('/tpapache/Projet_web3/admin.html'));
    exit();
}

// Vérifier si l'utilisateur est un administrateur
$user = getCurrentUser();
if (!isset($user['is_admin']) || !$user['is_admin']) {
    http_response_code(403);
    header('Location: /tpapache/Projet_web3/unauthorized.html');
    exit();
}

// Si tout est bon, renvoyer les informations de l'utilisateur
echo json_encode([
    'authenticated' => true,
    'user' => [
        'id' => $user['user_id'],
        'username' => $user['username'],
        'is_admin' => true
    ]
]);
?>
