<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

// Créer le dossier logs s'il n'existe pas
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/cluster_errors.log';

// On appelle le script Python qui renvoie un JSON des clusters
$python = 'python3';  // ou 'python' si python3 est le défaut
$script = __DIR__ . '/../scripts/cluster.py';

// Redirige stderr vers un fichier de log et ne capture que stdout
$cmd = sprintf(
    '%s %s 2>%s',
    escapeshellarg($python),
    escapeshellarg($script),
    escapeshellarg($logFile)
);

exec($cmd, $output, $code);

// Si le code de sortie n'est pas 0, on logge l'erreur
if ($code !== 0) {
    $errorDetails = [
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => 'Python script execution failed',
        'exit_code' => $code,
        'command' => $cmd,
        'output' => $output
    ];
    
    // Ajoute l'erreur au fichier de log
    file_put_contents(
        $logFile,
        json_encode($errorDetails, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n",
        FILE_APPEND
    );
    
    // Réponse d'erreur JSON
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur lors du calcul des clusters',
        'details' => 'Veuillez consulter les logs pour plus de détails'
    ]);
    exit;
}

// Concatène toutes les lignes de sortie du script (JSON potentiel très long)
$json = implode("", $output);

// Valide que le JSON est valide avant de l'envoyer
$decoded = json_decode($json);
if (json_last_error() !== JSON_ERROR_NONE) {
    // Si le JSON est invalide, on logge l'erreur
    $errorDetails = [
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => 'Invalid JSON from Python script',
        'json_error' => json_last_error_msg(),
        'output' => $output
    ];
    
    file_put_contents(
        $logFile,
        json_encode($errorDetails, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n",
        FILE_APPEND
    );
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur de format des données',
        'details' => 'Les données renvoyées par le serveur sont invalides'
    ]);
    exit;
}

// Si tout est bon, on envoie le JSON
header('Content-Type: application/json');
echo $json;
?>
