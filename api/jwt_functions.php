<?php
// Clé secrète pour signer les tokens (à remplacer par une clé sécurisée en production)
define('JWT_SECRET', 'votre_cle_secrete_tres_longue_et_aleatoire');

// Générer un JWT
function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['exp'] = time() + (60 * 60 * 24); // Expire dans 24 heures
    $payload['iat'] = time();
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

// Vérification du JWT
function verifyJWT($jwt) {
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) return false;
    
    list($base64UrlHeader, $base64UrlPayload, $signature) = $tokenParts;
    
    $signature = str_replace(['-', '_'], ['+', '/'], $signature);
    $signature = base64_decode(str_pad($signature, strlen($signature) % 4, '=', STR_PAD_RIGHT));
    
    $validSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    
    if (!hash_equals($signature, $validSignature)) {
        return false;
    }
    
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload)), true);
    
    // Vérifier l'expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

// Vérifier si l'utilisateur est connecté
function isLoggedIn() {
    if (isset($_COOKIE['auth_token'])) {
        $payload = verifyJWT($_COOKIE['auth_token']);
        return $payload !== false;
    }
    return false;
}

// Récupérer les informations de l'utilisateur connecté
function getCurrentUser() {
    if (isset($_COOKIE['auth_token'])) {
        return verifyJWT($_COOKIE['auth_token']);
    }
    return null;
}

// Définir le cookie d'authentification
function setAuthCookie($userId, $username, $isAdmin = false) {
    $payload = [
        'user_id' => $userId,
        'username' => $username,
        'is_admin' => (bool)$isAdmin
    ];
    
    $jwt = generateJWT($payload);
    
    // Définir le cookie avec les options de sécurité
    $expiry = time() + (60 * 60 * 24 * 30); // 30 jours
    if (PHP_VERSION_ID >= 70300) {
        setcookie('auth_token', $jwt, [
            'expires' => $expiry,
            'path' => '/',
            'domain' => '',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    } else {
        // Compatibilité avec PHP < 7.3 — SameSite via le path
        $path = '/; samesite=Strict';
        setcookie('auth_token', $jwt, $expiry, $path, '', isset($_SERVER['HTTPS']), true);
    }
}

// Supprimer le cookie d'authentification
function removeAuthCookie() {
    if (PHP_VERSION_ID >= 70300) {
        setcookie('auth_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    } else {
        $path = '/; samesite=Strict';
        setcookie('auth_token', '', time() - 3600, $path, '', isset($_SERVER['HTTPS']), true);
    }
}
?>
