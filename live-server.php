<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

$id = "8bc9a68b-e41c-4801-988f-a594e48762b6";
$url = "https://api.wardogservers.com/v1/servers/" . rawurlencode($id);
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => ["Accept: application/json", "User-Agent: FOB-site"],
]);
$raw = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);
if ($raw === false || $code !== 200) {
    http_response_code(503);
    echo json_encode(["error" => "offline"], JSON_UNESCAPED_UNICODE);
    exit;
}
$payload = json_decode($raw, true);
$data = is_array($payload["data"] ?? null) ? $payload["data"] : $payload;
if (!is_array($data) || empty($data["name"])) {
    http_response_code(503);
    echo json_encode(["error" => "offline"], JSON_UNESCAPED_UNICODE);
    exit;
}
$map = is_array($data["map"] ?? null) ? $data["map"] : [];
$mode = is_array($data["mode"] ?? null) ? $data["mode"] : [];
$experience = (string) ($mode["experience"] ?? "");
$modifiers = is_array($mode["modifiers"] ?? null) ? $mode["modifiers"] : [];
$blob = strtoupper(str_replace(["+", "_"], " ", $experience . " " . implode(" ", $modifiers)));
$label = "сессия";
foreach (["KOTH" => "Царь горы", "TDM" => "Командная бойня", "DM" => "Бойня", "INVASION" => "Вторжение", "PVE" => "PvE"] as $token => $title) {
    if (preg_match("/\\b" . $token . "\\b/", $blob)) {
        $label = $title;
        break;
    }
}
if (str_contains($blob, "INFANTRYONLY")) {
    $label .= " · пехота";
}
if (str_contains($blob, "LIMITEDGEAR")) {
    $label .= " · лимитед";
}
echo json_encode([
    "name" => (string) $data["name"],
    "map" => (string) ($map["variant"] ?? $map["base"] ?? "—"),
    "mode" => $label,
    "players" => (int) ($data["players"] ?? 0),
    "maxPlayers" => (int) ($data["maxPlayers"] ?? 0),
    "online" => true,
    "factions" => [],
], JSON_UNESCAPED_UNICODE);
