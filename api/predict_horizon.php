<?php
// api/predict_horizon.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Active l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Active la journalisation des erreurs
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Crée le répertoire de logs s'il n'existe pas
if (!is_dir(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}

function fail($msg, $details = null, $code = 500) {
    http_response_code($code);
    $response = ['error' => $msg];
    
    // Ajoute les détails seulement s'ils existent
    if ($details !== null) {
        $response['details'] = $details;
    }
    
    // Enregistre l'erreur dans les logs
    error_log("Erreur: " . $msg . " - " . json_encode($details));
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

// 1. Récupère les paramètres
$mmsi    = isset($_GET['mmsi'])    ? (int) $_GET['mmsi']    : 0;
$horizon = isset($_GET['horizon']) ? (int) $_GET['horizon'] : 0;

if ($mmsi <= 0 || !in_array($horizon, [5,10,15])) {
    fail('Invalid or missing parameters', ['mmsi'=>$mmsi,'horizon'=>$horizon], 400);
}

// 2. Définit les chemins
$baseDir = dirname(__DIR__);
$pythonScript = "$baseDir/scripts/horizons.py";
$inputCsv = "$baseDir/scripts/export_IA.csv";
$modelsDir = "$baseDir/scripts/models_predict";
$outCsv = "$baseDir/scripts/preds_single.csv";

// 3. Vérifie les fichiers/dossiers
if (!file_exists($pythonScript)) fail("$pythonScript not found");
if (!file_exists($inputCsv))     fail("$inputCsv not found");
if (!is_dir($modelsDir))         fail("$modelsDir not found");

// 4. Supprime l'ancien fichier de sortie s'il existe
if (file_exists($outCsv)) @unlink($outCsv);

// 5. Exécute le script Python
$pythonCandidates = ['python3', 'python', 'py'];
$cmd = null;
$output = [];
$returnCode = 1;

foreach ($pythonCandidates as $py) {
    $cmd = sprintf(
        '%s %s --input %s --models-dir %s --output %s --mmsi %d --horizon %d 2>&1',
        escapeshellarg($py),
        escapeshellarg($pythonScript),
        escapeshellarg($inputCsv),
        escapeshellarg($modelsDir),
        escapeshellarg($outCsv),
        $mmsi,
        $horizon
    );
    
    exec($cmd, $output, $returnCode);
    if ($returnCode === 0) break;
}

// 6. Vérifie le résultat
if ($returnCode !== 0) {
    fail('Python execution failed', [
        'command' => $cmd,
        'exit_code' => $returnCode,
        'output' => $output
    ]);
}

if (!file_exists($outCsv)) {
    fail('Prediction CSV not generated', [
        'expected_path' => $outCsv,
        'python_output' => $output
    ]);
}

// 7. Lit et renvoie le CSV généré
$rows = [];
$handle = @fopen($outCsv, 'r');
if ($handle === false) {
    fail('Failed to read generated CSV', [
        'error' => error_get_last(),
        'file' => $outCsv,
        'file_exists' => file_exists($outCsv),
        'is_readable' => is_readable($outCsv),
        'permissions' => substr(sprintf('%o', fileperms($outCsv)), -4)
    ]);
}

$headers = fgetcsv($handle);
if ($headers === false) {
    fclose($handle);
    fail('Empty or invalid CSV generated');
}

while (($data = fgetcsv($handle)) !== false) {
    $row = array_combine($headers, $data);
    $rows[] = [
        'time' => $row['BaseDateTime'] ?? null,
        'lat'  => isset($row['Predicted_LAT']) ? (float)$row['Predicted_LAT'] : null,
        'lon'  => isset($row['Predicted_LON']) ? (float)$row['Predicted_LON'] : null
    ];
}
fclose($handle);

// 8. Nettoie (optionnel)
@unlink($outCsv);

// 9. Vérifie si des prédictions ont été générées
if (empty($rows)) {
    fail('Aucune prédiction générée', [
        'python_output' => $output,
        'output_file_exists' => file_exists($outCsv),
        'output_file_size' => file_exists($outCsv) ? filesize($outCsv) : 0,
        'command' => $cmd,
        'exit_code' => $returnCode
    ]);
}

// 10. Renvoie le résultat
http_response_code(200);
$response = [
    'success' => true,
    'mmsi' => $mmsi,
    'horizon' => $horizon,
    'predictions' => $rows
];

// Ajoute les informations de débogage uniquement en développement
if (in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']) || strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) {
    $response['debug'] = [
        'python_script' => $pythonScript,
        'input_csv' => $inputCsv,
        'models_dir' => $modelsDir,
        'output_csv' => $outCsv,
        'command' => $cmd,
        'exec_output' => $output,
        'exec_return_code' => $returnCode,
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'N/A'
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
