<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

// On appelle le script Python qui renvoie un JSON des clusters
$python = 'C:\\Users\\arman\\AppData\\Local\\Programs\\Python\\Python312\\python.exe'; // chemin vers python avec mysql-connector
$script = __DIR__ . '/../scripts/cluster.py';
$cmd = '"' . $python . '" "' . $script . '" 2>&1';
exec($cmd, $output, $code);

if ($code !== 0) {
    http_response_code(500);
    echo json_encode(['error' => 'Python error', 'details' => $output]);
    exit;
}

// Concatène toutes les lignes de sortie du script (JSON potentiel très long)
$json = implode("", $output);
echo $json !== '' ? $json : '[]';
?>
