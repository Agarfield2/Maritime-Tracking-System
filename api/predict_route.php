<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$id_bateau = isset($_GET['id_bateau']) ? (int) $_GET['id_bateau'] : 0;
$cmd = 'python "' . __DIR__ . '/../scripts/route.py" ' . escapeshellarg($id_bateau);
exec($cmd, $output, $code);

if ($code !== 0) {
    http_response_code(500);
    echo json_encode(['error' => 'Python error', 'details' => $output]);
    exit;
}

echo $output[0] ?? 'null';
?>
