<?php
/**
 * Прокси обычного хостинга: браузер ходит только на этот домен.
 * Адрес Node лежит в api-upstream.txt одной строкой, например http://10.0.0.5:3000
 */
$upstreamFile = __DIR__ . '/api-upstream.txt';
$upstream = trim((string) @file_get_contents($upstreamFile));
if ($upstream === '') {
    $upstream = 'http://127.0.0.1:3000';
}
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$url = rtrim($upstream, '/') . $uri;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = file_get_contents('php://input');
$headers = [];
if (!empty($_SERVER['CONTENT_TYPE'])) {
    $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
}
if (!empty($_SERVER['HTTP_COOKIE'])) {
    $headers[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => $method === 'GET' || $method === 'HEAD' ? null : $body,
    CURLOPT_TIMEOUT => 25,
]);
$raw = curl_exec($ch);
if ($raw === false) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'API сейчас недоступен.';
    exit;
}
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);
$rawHeaders = substr($raw, 0, $headerSize);
$payload = substr($raw, $headerSize);
http_response_code($status);
foreach (preg_split("/\r\n|\n|\r/", $rawHeaders) as $line) {
    if (stripos($line, 'Content-Type:') === 0 || stripos($line, 'Set-Cookie:') === 0 || stripos($line, 'Location:') === 0) {
        header($line, false);
    }
}
echo $payload;
