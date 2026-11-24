<?php
/**
 * عباقرة - واجهة المزامنة التلقائية وحفظ تقدّم الطلاب على الاستضافة (.com)
 * لا تحتاج إعداد قاعدة بيانات MySQL — تنشئ وتحفظ تلقائيًا في data/students.json
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$dbFile = $dataDir . '/students.json';

function norm_name($name) {
    return mb_strtolower(trim((string)$name), 'UTF-8');
}

function merge_profile($existing, $incoming) {
    if (!$existing || !is_array($existing)) {
        return $incoming;
    }
    $out = $existing;
    $out['player'] = isset($incoming['player']) ? $incoming['player'] : $existing['player'];
    if (!empty($incoming['avatar'])) {
        $out['avatar'] = $incoming['avatar'];
    }
    if (!empty($incoming['lastLessonId'])) {
        $out['lastLessonId'] = $incoming['lastLessonId'];
    }
    $out['points'] = max((int)($existing['points'] ?? 0), (int)($incoming['points'] ?? 0));
    $out['bestStreak'] = max((int)($existing['bestStreak'] ?? 0), (int)($incoming['bestStreak'] ?? 0));
    $out['correct'] = max((int)($existing['correct'] ?? 0), (int)($incoming['correct'] ?? 0));
    $out['wrong'] = max((int)($existing['wrong'] ?? 0), (int)($incoming['wrong'] ?? 0));
    $out['played'] = max((int)($existing['played'] ?? 0), (int)($incoming['played'] ?? 0));
    $out['updatedAt'] = max((int)($existing['updatedAt'] ?? 0), (int)($incoming['updatedAt'] ?? 0), (int)(microtime(true) * 1000));

    $lessons = isset($existing['lessons']) && is_array($existing['lessons']) ? $existing['lessons'] : [];
    $incLessons = isset($incoming['lessons']) && is_array($incoming['lessons']) ? $incoming['lessons'] : [];

    foreach ($incLessons as $lid => $games) {
        if (!is_array($games)) continue;
        if (!isset($lessons[$lid]) || !is_array($lessons[$lid])) {
            $lessons[$lid] = [];
        }
        foreach ($games as $gid => $cell) {
            if (!is_array($cell)) continue;
            $prev = isset($lessons[$lid][$gid]) && is_array($lessons[$lid][$gid])
                ? $lessons[$lid][$gid]
                : ['best' => 0, 'stars' => 0, 'plays' => 0];
            $lessons[$lid][$gid] = [
                'best'  => max((int)($prev['best'] ?? 0), (int)($cell['best'] ?? 0)),
                'stars' => min(3, max((int)($prev['stars'] ?? 0), (int)($cell['stars'] ?? 0))),
                'plays' => max((int)($prev['plays'] ?? 0), (int)($cell['plays'] ?? 0))
            ];
        }
    }
    $out['lessons'] = $lessons;

    $totalStars = 0;
    foreach ($lessons as $games) {
        if (!is_array($games)) continue;
        foreach ($games as $cell) {
            $totalStars += min(3, max(0, (int)($cell['stars'] ?? 0)));
        }
    }
    $out['stars'] = max($totalStars, (int)($out['stars'] ?? 0));
    return $out;
}

$fp = @fopen($dbFile, 'c+');
if (!$fp) {
    echo json_encode(['ok' => false, 'error' => 'Cannot open data store'], JSON_UNESCAPED_UNICODE);
    exit;
}

flock($fp, LOCK_EX);
$raw = stream_get_contents($fp);
$db = $raw ? json_decode($raw, true) : [];
if (!is_array($db)) {
    $db = [];
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'POST') {
    $bodyRaw = file_get_contents('php://input');
    $body = $bodyRaw ? json_decode($bodyRaw, true) : [];
    if (is_array($body) && isset($body['action'])) {
        $action = $body['action'];
    }

    if ($action === 'delete') {
        $key = norm_name($body['player'] ?? '');
        if ($key && isset($db[$key])) {
            unset($db[$key]);
        }
    } else {
        $incomingList = [];
        if (isset($body['profile']) && is_array($body['profile'])) {
            $incomingList[] = $body['profile'];
        }
        if (isset($body['profiles']) && is_array($body['profiles'])) {
            foreach ($body['profiles'] as $p) {
                if (is_array($p)) $incomingList[] = $p;
            }
        }
        $lastMerged = null;
        foreach ($incomingList as $prof) {
            $pName = trim((string)($prof['player'] ?? ''));
            if ($pName === '' || $pName === 'صديقي') continue;
            $key = norm_name($pName);
            $db[$key] = merge_profile($db[$key] ?? null, $prof);
            $lastMerged = $db[$key];
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($db, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        echo json_encode([
            'ok' => true,
            'profile' => $lastMerged,
            'totalStudents' => count($db)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($db, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fp);
}

flock($fp, LOCK_UN);
fclose($fp);

if ($action === 'get') {
    $key = norm_name($_GET['player'] ?? '');
    $found = ($key && isset($db[$key])) ? $db[$key] : null;
    echo json_encode(['ok' => true, 'profile' => $found], JSON_UNESCAPED_UNICODE);
    exit;
}

$list = array_values($db);
usort($list, function ($a, $b) {
    $s = ((int)($b['stars'] ?? 0)) - ((int)($a['stars'] ?? 0));
    if ($s !== 0) return $s;
    return ((int)($b['points'] ?? 0)) - ((int)($a['points'] ?? 0));
});

echo json_encode([
    'ok' => true,
    'count' => count($list),
    'students' => $list
], JSON_UNESCAPED_UNICODE);
