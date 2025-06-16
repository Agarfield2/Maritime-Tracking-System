<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

// On appelle le script Python qui renvoie un JSON des clusters
$cmd = 'python "' . __DIR__ . '/../scripts/cluster.py"';
exec($cmd, $output, $code);

if ($code !== 0) {
    http_response_code(500);
    echo json_encode(['error' => 'Python error', 'details' => $output]);
    exit;
}

// Le script renvoie son résultat en une ligne JSON
echo $output[0] ?? '[]';
?>
