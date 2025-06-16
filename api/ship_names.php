<?php
require_once __DIR__.'/db.php';
$sql="SELECT id_bateau AS id, VesselName AS name FROM bateau WHERE VesselName IS NOT NULL AND VesselName<>'' ORDER BY name";
$stmt=$pdo->query($sql);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
