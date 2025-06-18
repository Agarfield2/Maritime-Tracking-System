<?php
require_once __DIR__.'/db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// fonction utilitaire pour récupérer/insérer un statut et renvoyer son id
function resolveStatutId(PDO $pdo, $code){
    $stmt = $pdo->prepare('SELECT id_statut FROM statut WHERE statut = ? LIMIT 1');
    $stmt->execute([$code]);
    $id = $stmt->fetchColumn();
    if($id){
        return $id;
    }
    $stmt = $pdo->prepare('INSERT INTO statut (statut) VALUES (?)');
    $stmt->execute([$code]);
    return $pdo->lastInsertId();
}

switch ($method) {
    case 'POST':
        // Ajout d'une position
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad JSON']);
            exit;
        }
        $fields = ['BaseDateTime','LAT','LON','SOG','COG','Heading','id_statut','id_bateau'];
        foreach ($fields as $f) {
            if (!isset($data[$f])) {
                http_response_code(400);
                echo json_encode(['error' => "Champ $f manquant"]);
                exit;
            }
        }
                try {
            $pdo->beginTransaction();
            // Résoudre id_statut
            $resolvedStatutId = resolveStatutId($pdo, $data['id_statut']);
            // Insérer dans position_AIS
            $stmt = $pdo->prepare('INSERT INTO position_AIS (BaseDateTime,LAT,LON,SOG,COG,Heading,id_statut) VALUES (?,?,?,?,?,?,?)');
            $stmt->execute([
                $data['BaseDateTime'],
                $data['LAT'],
                $data['LON'],
                $data['SOG'],
                $data['COG'],
                $data['Heading'],
                $resolvedStatutId,
            ]);
            $posId = $pdo->lastInsertId();
            // Lier au bateau
            $stmt = $pdo->prepare('INSERT INTO possede (id_position,id_bateau) VALUES (?,?)');
            $stmt->execute([$posId, $data['id_bateau']]);
            $pdo->commit();
            echo json_encode(['success'=>true,'id_position'=>$posId]);
        } catch(PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error'=>$e->getMessage()]);
        }
        break;

    case 'PUT':
        // Modification d'une position
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id_position'])) {
            http_response_code(400);
            echo json_encode(['error' => 'id_position requis']);
            exit;
        }
        $id = (int)$data['id_position'];
        $updates = [];
        $params = [];
        // résoudre statut si fourni
        $statutId = null;
        if(isset($data['id_statut'])){
            $statutId = resolveStatutId($pdo, $data['id_statut']);
        }
        $fields = ['BaseDateTime','LAT','LON','SOG','COG','Heading','id_statut'];
        foreach ($fields as $f) {
            if (isset($data[$f])) {
                $updates[] = "$f = ?";
                $params[] = ($f==='id_statut') ? $statutId : $data[$f];
            }
        }
        if (!empty($updates)) {
            $params[] = $id;
            $sql = 'UPDATE position_AIS SET '.implode(',', $updates).' WHERE id_position = ?';
            $stmt = $pdo->prepare($sql);
            try {
                $stmt->execute($params);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['error'=>$e->getMessage()]);
                exit;
            }
        }
        // Gérer éventuel changement de bateau
        // changement de bateau
        if (isset($data['id_bateau'])) {
            $stmt = $pdo->prepare('UPDATE possede SET id_bateau = ? WHERE id_position = ?');
            try {
                $stmt->execute([$data['id_bateau'],$id]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['error'=>$e->getMessage()]);
                exit;
            }
        }
        echo json_encode(['success'=>true]);
        break;

    case 'DELETE':
        // Suppression d'une position
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id_position'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error'=>'id_position requis']);
            exit;
        }
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('DELETE FROM possede WHERE id_position = ?');
            $stmt->execute([$id]);
            $stmt = $pdo->prepare('DELETE FROM position_AIS WHERE id_position = ?');
            $stmt->execute([$id]);
            $pdo->commit();
            echo json_encode(['success'=>true]);
        } catch(PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error'=>$e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error'=>'Method Not Allowed']);
}
?>
