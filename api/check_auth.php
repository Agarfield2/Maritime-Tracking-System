<?php
require_once 'jwt_functions.php';

// Vérifier si l'utilisateur est authentifié
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['authenticated' => false]);
    exit();
}

// Récupérer les informations de l'utilisateur
$user = getCurrentUser();
echo json_encode([
    'authenticated' => true,
    'user' => [
        'id' => $user['user_id'],
        'username' => $user['username']
    ]
]);
?>
