<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// possibilité de filtrer par id_bateau passé en query ?id_bateau=xx
$id_bateau = isset($_GET['id_bateau']) ? (int) $_GET['id_bateau'] : null;

$sql = 'SELECT p.*, b.MMSI, b.VesselName, b.Length, b.Width, b.Draft, st.statut AS Etat
        FROM position_AIS p 
        JOIN possede po ON p.id_position = po.id_position
        JOIN bateau b ON po.id_bateau = b.id_bateau
        LEFT JOIN statut st ON p.id_statut = st.id_statut';
$params = [];
if ($id_bateau) {
    $sql .= ' WHERE po.id_bateau = ?';
    $params[] = $id_bateau;
}
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode($stmt->fetchAll());
?>
