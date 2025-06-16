<?php
// Enable full error reporting for debugging.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// api/predict_route.php
// This script acts as a bridge to execute the Python script.
header('Content-Type: application/json');

// Get MMSI from the query string.
$mmsi = isset($_GET['mmsi']) ? trim($_GET['mmsi']) : '';

if (empty($mmsi)) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'MMSI parameter is missing or empty.']);
    exit;
}

// Ensure the command is safe to execute.
$python_path = 'python'; // Or specify full path if needed e.g. 'C:\Python39\python.exe'
$script_path = realpath(__DIR__ . '/../scripts/route.py');

if ($script_path === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Python script not found.']);
    exit;
}

// Construct and execute the command.
// Using an absolute path to the script and redirecting stderr (2>&1) for robust error capture.
$command = 'python C:\\wamp64\\www\\webais\\Projet_web3\\scripts\\route.py ' . escapeshellarg($mmsi) . ' 2>&1';
exec($command, $output, $return_code);

// Check for execution errors.
if ($return_code !== 0) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Python script execution failed.',
        'return_code' => $return_code,
        'output' => $output
    ]);
    exit;
}

// The Python script should output a single line of JSON.
// If output is empty or not valid JSON, it's an error.
$json_output = !empty($output) ? $output[0] : '{}';
// Set a success header, important for fetch API to know it's ok.
http_response_code(200);
echo $json_output;

?>
