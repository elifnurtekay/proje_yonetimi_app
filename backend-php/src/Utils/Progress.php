<?php

declare(strict_types=1);

namespace App\Utils;

use DateTimeImmutable;

class Progress
{
    public static function normalize(?int $value): int
    {
        $value = (int)($value ?? 0);
        return max(0, min(100, $value));
    }

    public static function calculateTimeProgress(?string $start, ?string $end, ?string $today = null): ?int
    {
        if (!$start || !$end) {
            return null;
        }

        $startDate = new DateTimeImmutable($start);
        $endDate = new DateTimeImmutable($end);
        $todayDate = $today ? new DateTimeImmutable($today) : new DateTimeImmutable('today');

        $totalDays = (int)$endDate->diff($startDate)->format('%r%a');
        if ($totalDays <= 0) {
            return $todayDate >= $endDate ? 100 : 0;
        }

        $elapsed = (int)$todayDate->diff($startDate)->format('%r%a');
        if ($elapsed <= 0) {
            return 0;
        }

        if ($todayDate >= $endDate) {
            return 100;
        }

        $ratio = $elapsed / $totalDays;
        return max(0, min(100, (int)round($ratio * 100)));
    }

    public static function taskProgress(array $task, ?string $today = null): array
    {
        $manual = self::normalize($task['progress'] ?? 0);
        $dueDate = $task['due_date'] ?? $task['end_date'] ?? null;
        $dynamic = self::calculateTimeProgress($task['start_date'] ?? null, $dueDate, $today);
        $effective = max($manual, $dynamic ?? 0);

        return [
            'manual' => $manual,
            'dynamic' => $dynamic,
            'effective' => $effective,
        ];
    }

    public static function projectProgress(array $project, array $tasks, ?string $today = null): array
    {
        $manual = self::normalize($project['progress'] ?? 0);
        $taskValues = [];
        foreach ($tasks as $task) {
            $taskValues[] = self::taskProgress($task, $today)['effective'];
        }
        $taskBased = $taskValues ? (int)round(array_sum($taskValues) / count($taskValues)) : null;
        $timeBased = self::calculateTimeProgress($project['start_date'] ?? null, $project['end_date'] ?? null, $today);
        $candidates = array_filter([$taskBased, $timeBased], fn($v) => $v !== null);
        $dynamic = $candidates ? max($candidates) : null;
        $effective = max($manual, $dynamic ?? 0);

        return [
            'manual' => $manual,
            'dynamic' => $dynamic,
            'effective' => $effective,
        ];
    }
}
