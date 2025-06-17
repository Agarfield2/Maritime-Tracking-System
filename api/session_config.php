<?php
// Configuration des sessions
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Mettez à 1 en production avec HTTPS
ini_set('session.cookie_samesite', 'Lax');
session_set_cookie_params([
    'lifetime' => 3600, // Durée de vie de la session en secondes (1 heure)
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'] ?? '',
    'secure' => false, // Mettez à true en production avec HTTPS
    'httponly' => true,
    'samesite' => 'Lax'
]);
?>
