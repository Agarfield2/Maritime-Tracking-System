<?php
require_once 'jwt_functions.php';

// Supprimer le cookie d'authentification
removeAuthCookie();

// Répondre avec succès
header('Content-Type: application/json');
http_response_code(200);
echo json_encode(['success' => true]);
