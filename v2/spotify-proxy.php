<?php
/**
 * WXM ONE RADIO — Spotify Proxy (Hardened)
 * =========================================
 * INSTRUCCIONES DE DESPLIEGUE SEGURO:
 *
 * 1. Crea el archivo de secretos UNA carpeta ARRIBA del webroot:
 *    /home/tu_usuario/spotify-secrets.php   ← fuera de public_html/
 *    Con este contenido:
 *      <?php
 *      define('SPOTIFY_CLIENT_ID',     'TU_CLIENT_ID_REAL');
 *      define('SPOTIFY_CLIENT_SECRET', 'TU_CLIENT_SECRET_REAL');
 *
 * 2. Rota las credenciales actuales en https://developer.spotify.com
 *    porque estuvieron expuestas en el código fuente.
 *
 * 3. En Hostinger, ajusta ALLOWED_ORIGIN al dominio real de producción.
 *
 * API pública:
 *   GET spotify-proxy.php?action=search&q=ARTISTA%20TITULO
 */

// ── Cabeceras base ─────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// ── Secretos: cargados desde fuera del webroot ─────────────────────────────
$secrets_path = dirname(__DIR__) . '/spotify-secrets.php';
if (file_exists($secrets_path)) {
    require_once $secrets_path;
} else {
    // Fallback: variables de entorno (útil en hosting con soporte env)
    define('SPOTIFY_CLIENT_ID',     getenv('SPOTIFY_CLIENT_ID')     ?: '');
    define('SPOTIFY_CLIENT_SECRET', getenv('SPOTIFY_CLIENT_SECRET') ?: '');
}

if (!defined('SPOTIFY_CLIENT_ID')) define('SPOTIFY_CLIENT_ID', '');
if (!defined('SPOTIFY_CLIENT_SECRET')) define('SPOTIFY_CLIENT_SECRET', '');

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    http_response_code(503);
    echo json_encode(['error' => 'Servicio no configurado']);
    exit;
}

// ── CORS: solo permite el dominio propio y runtimes Capacitor ───────────────
// Cambia el dominio web real en producción si usas otro host.
$allowed_origins = [
    'https://wxmoneradio.com',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} elseif ($origin !== '') {
    http_response_code(403);
    echo json_encode(['error' => 'Origen no permitido']);
    exit;
}

// Solo GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// ── Allowlist de acciones ──────────────────────────────────────────────────
$allowed_actions = ['search'];
$action = $_GET['action'] ?? '';

if (!in_array($action, $allowed_actions, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Acción no válida']);
    exit;
}

// ── Rate limiting básico compatible con hosting compartido ─────────────────
function wxm_rate_limit(string $bucket, int $limit = 30, int $window = 60): bool {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash('sha256', $bucket . '|' . $ip);
    $file = sys_get_temp_dir() . '/wxm_rate_' . $key . '.json';
    $now = time();
    $data = ['start' => $now, 'count' => 0];

    if (is_readable($file)) {
        $decoded = json_decode((string) file_get_contents($file), true);
        if (is_array($decoded) && isset($decoded['start'], $decoded['count'])) {
            $data = $decoded;
        }
    }

    if (($now - (int) $data['start']) >= $window) {
        $data = ['start' => $now, 'count' => 0];
    }

    if ((int) $data['count'] >= $limit) {
        return false;
    }

    $data['count'] = (int) $data['count'] + 1;
    @file_put_contents($file, json_encode($data), LOCK_EX);
    return true;
}

if (!wxm_rate_limit('spotify-search')) {
    http_response_code(429);
    echo json_encode(['error' => 'Demasiadas solicitudes']);
    exit;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function wxm_strlen(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function wxm_safe_image_url($url): ?string {
    if (!is_string($url) || $url === '') return null;
    $parts = parse_url($url);
    if (!$parts || (($parts['scheme'] ?? '') !== 'https') || empty($parts['host'])) return null;

    $host = strtolower($parts['host']);
    $allowed = ['i.scdn.co', 'mosaic.scdn.co'];
    foreach ($allowed as $domain) {
        $suffix = '.' . $domain;
        if ($host === $domain || substr($host, -strlen($suffix)) === $suffix) {
            return $url;
        }
    }
    return null;
}

function wxm_json_response(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function wxm_curl(string $url, array $opts = []): ?array {
    if (!function_exists('curl_init')) {
        return null;
    }

    $ch = curl_init();
    curl_setopt_array($ch, array_replace([
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT      => 'WXM-Radio-Player/2.0',
    ], $opts));
    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        curl_close($ch);
        return null;
    }
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($result === false || $status < 200 || $status >= 300) {
        return null;
    }
    return ['body' => $result, 'status' => $status];
}

function wxm_get_spotify_token(): ?string {
    $result = wxm_curl('https://accounts.spotify.com/api/token', [
        CURLOPT_POST       => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_HTTPHEADER => [
            'Authorization: Basic ' . base64_encode(SPOTIFY_CLIENT_ID . ':' . SPOTIFY_CLIENT_SECRET),
            'Content-Type: application/x-www-form-urlencoded',
        ],
    ]);

    $data = $result ? json_decode($result['body'], true) : null;
    return is_array($data) ? ($data['access_token'] ?? null) : null;
}

// ── Acción: search ─────────────────────────────────────────────────────────
if ($action === 'search') {
    // Validar q
    $q = trim($_GET['q'] ?? '');
    if ($q === '' || wxm_strlen($q) > 160 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $q)) {
        wxm_json_response(['error' => 'Parámetro q inválido'], 400);
    }

    // type: solo 'track' permitido
    $allowed_types = ['track'];
    $type = $_GET['type'] ?? 'track';
    if (!in_array($type, $allowed_types, true)) {
        $type = 'track';
    }

    // El token lo obtiene el servidor internamente y nunca se devuelve al cliente.
    $token = wxm_get_spotify_token();

    if (!$token) {
        wxm_json_response(['error' => 'No se pudo obtener token'], 502);
    }

    $url = 'https://api.spotify.com/v1/search?q=' . urlencode($q)
         . '&type=' . urlencode($type) . '&limit=5';

    $result = wxm_curl($url, [
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
    ]);

    if ($result === null) {
        wxm_json_response(['error' => 'Error buscando en Spotify'], 502);
    }

    $spotify = json_decode($result['body'], true);
    if (!is_array($spotify)) {
        wxm_json_response(['error' => 'Respuesta inválida de Spotify'], 502);
    }

    $items = $spotify['tracks']['items'] ?? [];
    $safe_items = [];
    foreach (array_slice($items, 0, 5) as $item) {
        $images = [];
        foreach (($item['album']['images'] ?? []) as $image) {
            $safe_url = wxm_safe_image_url($image['url'] ?? null);
            if ($safe_url) {
                $images[] = [
                    'url' => $safe_url,
                    'width' => (int) ($image['width'] ?? 0),
                    'height' => (int) ($image['height'] ?? 0),
                ];
            }
        }
        $safe_items[] = ['album' => ['images' => $images]];
    }

    wxm_json_response(['tracks' => ['items' => $safe_items]]);
}
