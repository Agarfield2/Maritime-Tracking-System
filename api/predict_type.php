<?php
// Optional: Commented out to avoid DB failure for this endpoint
// require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

// Quick diagnostic endpoint: /api/predict_type.php?diag=1
if(isset($_GET['diag'])){
    $candidates=['python3','python','py'];
    $diag=[];
    foreach($candidates as $py){
        $out=[];$code=0;
        exec(escapeshellcmd("$py -V 2>&1"),$out,$code);
        $diag[]=[ 'cmd'=>"$py -V", 'code'=>$code, 'out'=>$out];
    }
    echo json_encode($diag);
    exit;
}

set_time_limit(20);
$execStart = microtime(true);
ini_set('display_errors', 0); // errors will be returned in JSON instead
error_reporting(E_ALL);

// Catch fatal errors too
register_shutdown_function(function(){
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR,E_PARSE,E_CORE_ERROR,E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode([
            'error'   => 'PHP fatal error',
            'details' => $err['message'],
            'file'    => basename($err['file']),
            'line'    => $err['line']
        ]);
    }
});

// Convert PHP warnings/notices into JSON responses
set_error_handler(function($severity, $message, $file, $line){
    http_response_code(500);
    echo json_encode([
        'error'   => 'PHP runtime warning',
        'details' => $message,
        'file'    => basename($file),
        'line'    => $line
    ]);
    exit;
});

// List of expected numeric query parameters
$params = ['SOG', 'COG', 'Heading', 'Length', 'Width', 'Draft'];
$args = [];

// Validate presence of each parameter and build argument string
foreach ($params as $param) {
    if (!isset($_GET[$param])) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => "Missing parameter '$param'"]);
        exit;
    }
    // Ensure numeric value and escape it for the shell
    $value = (float) $_GET[$param];
    $args[] = '--' . $param . ' ' . escapeshellarg($value);
}

$script = __DIR__ . '/../scripts/type.py';
$pythonCandidates = ['python3', 'python', 'py'];
$output = $allOutputs = [];
$code = 1;
foreach ($pythonCandidates as $py) {
    $cmd = escapeshellcmd("$py $script") . ' ' . implode(' ', $args) . ' 2>&1';
    $output = [];
    exec($cmd, $output, $code);
    $allOutputs[] = [ 'cmd' => $cmd, 'code' => $code, 'out' => $output ];
    if ($code === 0) {
        break;
    }
}

$execDuration = round(microtime(true)-$execStart,2);
if ($code !== 0) {
    // Join output lines for readability
    foreach ($allOutputs as &$a) {
        $a['out'] = implode("\n", $a['out']);
    }
    http_response_code(500);
    echo json_encode([
        'error'        => 'Python execution failed',
        'attempts'     => $allOutputs,
        'exec_time'    => $execDuration
    ]);
    exit;
}

// Detect if Python output contains an error/traceback even when exit code is 0
$pythonErrors = array_filter($output, function($l){
    return preg_match('/(Traceback|Error|Exception|Erreur)/i', $l);
});

// Try to extract the predicted type from Python output (avoid UTF-8 regex issues)
$predictedType = null;
foreach (array_reverse($output) as $line) {
    $trim = trim($line);
    if ($trim === '') continue;
    // We expect a format like "Type de navire prédit : <TYPE>"
    $parts = explode(':', $trim, 2);
    if (count($parts) === 2) {
        $candidate = trim($parts[1]);
        if ($candidate !== '') {
            $predictedType = $candidate;
            break;
        }
    }
}

$result_text = implode("\n", $output);

$execDuration = round(microtime(true)-$execStart,2);

// If python printed error lines, surface them
if(!empty($pythonErrors)){
    http_response_code(500);
    echo json_encode([
        'error'          => 'Python runtime error detected',
        'python_errors'  => implode("\n", $pythonErrors),
        'python_output'  => $result_text,
        'exec_time'      => $execDuration
    ]);
    exit;
}

// If we could not parse a predicted type, raise an error but still expose python output
if ($predictedType === null) {
    http_response_code(500);
    echo json_encode([
        'error'         => 'Could not parse predicted type',
        'python_output' => $result_text,
        'exec_time'     => $execDuration
    ]);
    exit;
}

http_response_code(200);

error_log('predict_type exec time: '.$execDuration.'s');

echo json_encode([
    'type'       => $predictedType,
    'python_output' => $result_text,
    'exec_time'  => $execDuration
]);
?>
