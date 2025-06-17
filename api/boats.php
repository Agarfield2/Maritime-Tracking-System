<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Retourne la liste de tous les bateaux
        $stmt = $pdo->query('SELECT * FROM bateau');
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        // Ajout d'un bateau
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad JSON']);
            exit;
        }

        $sql = 'INSERT INTO bateau (MMSI, IMO, CallSign, VesselName, VesselType, Length, Width, Draft, Cargo, TransceiverClass) VALUES (?,?,?,?,?,?,?,?,?,?)';
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $data['MMSI'] ?? null,
                $data['IMO'] ?? null,
                $data['CallSign'] ?? null,
                $data['VesselName'] ?? null,
                $data['VesselType'] ?? null,
                $data['Length'] ?? null,
                $data['Width'] ?? null,
                $data['Draft'] ?? null,
                $data['Cargo'] ?? null,
                $data['TransceiverClass'] ?? null
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Modification d'un bateau
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['MMSI'])) {
            http_response_code(400);
            echo json_encode(['error' => 'MMSI requis pour modification']);
            exit;
        }
        $fields = ['IMO','CallSign','VesselName','VesselType','Length','Width','Draft','Cargo','TransceiverClass'];
        $updates = [];
        $params = [];
        foreach ($fields as $f) {
            if (isset($data[$f])) {
                $updates[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'Aucun champ à modifier']);
            exit;
        }
        $params[] = $data['MMSI'];
        $sql = 'UPDATE bateau SET '.implode(',', $updates).' WHERE MMSI = ?';
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Suppression d'un bateau
        $data = json_decode(file_get_contents('php://input'), true);
        $mmsi = $data['MMSI'] ?? null;
        if (!$mmsi) {
            http_response_code(400);
            echo json_encode(['error' => 'MMSI requis pour suppression']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM bateau WHERE MMSI = ?');
        try {
            $stmt->execute([$mmsi]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
}
?>
