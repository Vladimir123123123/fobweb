<?php
header("Content-Type: text/html; charset=utf-8");
header("Cache-Control: public, max-age=60");

$page = __DIR__ . "/index.html";
$html = is_file($page) ? file_get_contents($page) : false;
if ($html === false) {
    http_response_code(404);
    echo "Страница не собрана.";
    exit;
}

$live = live_card();
if ($live === null) {
    echo $html;
    exit;
}

$html = put_meta($html, "og:title", $live["title"]);
$html = put_meta($html, "og:description", $live["description"]);
$html = put_meta($html, "twitter:title", $live["title"]);
$html = put_meta($html, "twitter:description", $live["description"]);
$html = put_meta($html, "description", $live["description"]);
$html = put_meta($html, "og:image", "https://fob-wd.ru/brand/logo.png");
$html = put_meta($html, "twitter:image", "https://fob-wd.ru/brand/logo.png");
$html = put_meta($html, "og:image:width", "512");
$html = put_meta($html, "og:image:height", "512");
$html = put_meta($html, "twitter:card", "summary");
$safe = htmlspecialchars($live["title"], ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
$html = preg_replace("/<title>[^<]*<\\/title>/", "<title>{$safe}</title>", $html, 1);
echo $html;

function put_meta(string $html, string $key, string $value): string {
    $safe = htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
    $quoted = preg_quote($key, "/");
    $pattern = '/(<meta\b[^>]*\b(?:property|name)="' . $quoted . '"[^>]*\bcontent=")[^"]*(")/i';
    $count = 0;
    $next = preg_replace($pattern, '$1' . $safe . '$2', $html, 1, $count);
    if ($count === 0) {
        $pattern = '/(<meta\b[^>]*\bcontent=")[^"]*("[^>]*\b(?:property|name)="' . $quoted . '")/i';
        $next = preg_replace($pattern, '$1' . $safe . '$2', $html, 1);
    }
    return is_string($next) ? $next : $html;
}

function live_card(): ?array {
    $id = "8bc9a68b-e41c-4801-988f-a594e48762b6";
    $url = "https://api.wardogservers.com/v1/servers/" . rawurlencode($id);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_HTTPHEADER => ["Accept: application/json", "User-Agent: FOB-preview"],
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($raw === false || ($code !== 200 && $code !== 404)) {
        return null;
    }
    if ($code === 404) {
        return [
            "title" => "FOB #1 · не в сети",
            "description" => "Сервер сейчас не в сети. Сезон 03. Сборки, оружие, техника и рейтинг.",
        ];
    }
    $payload = json_decode($raw, true);
    $data = is_array($payload["data"] ?? null) ? $payload["data"] : $payload;
    if (!is_array($data) || empty($data["name"])) {
        return null;
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
    $mapName = (string) ($map["variant"] ?? $map["base"] ?? "—");
    $players = (int) ($data["players"] ?? 0);
    $max = (int) ($data["maxPlayers"] ?? 0);
    $cap = $max > 0 ? (string) $max : "?";
    return [
        "title" => (string) $data["name"],
        "description" => "Онлайн · {$players}/{$cap} · {$mapName} · {$label}",
    ];
}
