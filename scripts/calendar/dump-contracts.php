<?php

declare(strict_types=1);

/**
 * Out-of-band calendar dump (never runs in CI).
 *
 * Consumes introibo Core's public `contract()` entry point to emit the 1962 liturgical day for a
 * civil-date range as JSON: `{ "Y-m-d": <DayContract array>, ... }` to stdout. introibo Core is the
 * AGPL engine; Bosco vendors only its CC0 corpus OUTPUT (this JSON), never the engine code.
 *
 * PHP is not part of Bosco's build. Run this manually (e.g. via WSL) and pipe it into
 * `vendor-calendar.mjs`, which projects it into the compact, committed `calendar.json`.
 *
 * Usage:
 *   php dump-contracts.php CORE_AUTOLOAD START END
 *   php scripts/calendar/dump-contracts.php /path/introibo/Core/vendor/autoload.php 2026-01-01 2026-12-31
 */

$autoload = $argv[1] ?? '';
$start = $argv[2] ?? '';
$end = $argv[3] ?? '';

if (!is_file($autoload) || $start === '' || $end === '') {
    fwrite(STDERR, "usage: php dump-contracts.php CORE_AUTOLOAD START END\n");
    exit(1);
}

require $autoload;

use function Directorium\Core\contract;

$cursor = new DateTimeImmutable($start);
$last = new DateTimeImmutable($end);
$out = [];

while ($cursor <= $last) {
    $out[$cursor->format('Y-m-d')] = contract($cursor);
    $cursor = $cursor->modify('+1 day');
}

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
