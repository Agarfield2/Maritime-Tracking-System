<?php
// API pour récupérer les positions paginées
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Paramètres de pagination
$page  = isset($_GET['page'])  ? max(1, (int)$_GET['page'])  : 1;
$limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
$offset = ($page - 1) * $limit;

try {
    // Compter le nombre total de positions pour la pagination
    $idBateau = isset($_GET['id_bateau']) ? (int)$_GET['id_bateau'] : null;

    $countSql = 'SELECT COUNT(*) as total
                 FROM position_AIS p
                 JOIN possede po ON po.id_position = p.id_position';
    if ($idBateau) {
        $countSql .= ' WHERE po.id_bateau = :id_bateau';
    }
        $countStmt = $pdo->prepare($countSql);
    if ($idBateau) {
        $countStmt->bindValue(':id_bateau', $idBateau, PDO::PARAM_INT);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Récupérer les données paginées
    $dataSql = 'SELECT p.id_position,
                       p.BaseDateTime,
                       p.LAT,
                       p.LON,
                       p.SOG,
                       p.COG,
                       p.Heading,
                       st.statut   AS Statut,
                       b.VesselName
                FROM position_AIS p
                JOIN possede po    ON po.id_position = p.id_position
                JOIN bateau b      ON b.id_bateau   = po.id_bateau
                LEFT JOIN statut st ON st.id_statut = p.id_statut';
    if ($idBateau) {
        $dataSql .= ' WHERE po.id_bateau = :id_bateau';
    }
    $dataSql .= ' ORDER BY p.BaseDateTime DESC
                  LIMIT :limit OFFSET :offset';
        $stmt = $pdo->prepare($dataSql);
    if ($idBateau) {
        $stmt->bindValue(':id_bateau', $idBateau, PDO::PARAM_INT);
    }
    $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode([
        'total'     => $total,
        'positions' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
