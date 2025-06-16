<?php
// Database connection using PDO

$host = 'localhost';       // <-- adapte si ton MySQL n\'est pas local
$db   = 'marine_db';         // nom de la base définie via ton script SQL
$user = 'bateau';            // utilisateur MySQL
$pass = '123456mdp';                // mot de passe MySQL
$charset = 'utf8mb4';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed', 'details' => $e->getMessage()]);
    exit;
}
?>
