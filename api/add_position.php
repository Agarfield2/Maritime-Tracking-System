<?php
require_once __DIR__.'/db.php';
header('Content-Type: application/json');
$input=json_decode(file_get_contents('php://input'),true);
$required=['id_bateau','BaseDateTime','LAT','LON','SOG','COG','Heading','Status'];
foreach($required as $k){if(!isset($input[$k])){http_response_code(400);echo json_encode(['error'=>'champ manquant: '.$k]);exit;}}

try{
  // statut
  $stmt=$pdo->prepare('SELECT id_statut FROM statut WHERE statut=?');
  $stmt->execute([$input['Status']]);
  $row=$stmt->fetch(PDO::FETCH_NUM);
  if($row){$id_statut=$row[0];}else{
    $pdo->prepare('INSERT INTO statut(statut) VALUES(?)')->execute([$input['Status']]);
    $id_statut=$pdo->lastInsertId();
  }
  // position
  $sql='INSERT INTO position_AIS(BaseDateTime,LAT,LON,SOG,COG,Heading,id_statut) VALUES(?,?,?,?,?,?,?)';
  $stmt=$pdo->prepare($sql);
  $stmt->execute([$input['BaseDateTime'],$input['LAT'],$input['LON'],$input['SOG'],$input['COG'],$input['Heading'],$id_statut]);
  $id_position=$pdo->lastInsertId();
  // lien
  $pdo->prepare('INSERT INTO possede(id_position,id_bateau) VALUES(?,?)')->execute([$id_position,$input['id_bateau']]);
  echo json_encode(['id_position'=>$id_position]);
}catch(PDOException $e){http_response_code(500);echo json_encode(['error'=>$e->getMessage()]);}
?>
