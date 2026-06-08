<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StatsService
{
    /**
     * Global counters for the admin dashboard.
     *
     * @return array<string, int>
     */
    public function globals(): array
    {
        return [
            'total_reservations' => Reservation::count(),
            'reservations_today' => Reservation::whereDate('date', Carbon::today())->count(),
            'cancelled_reservations' => Reservation::where('status', ReservationStatus::CANCELLED->value)->count(),
            'total_rooms' => Room::count(),
            'total_users' => User::count(),
        ];
    }

    /**
     * Reservations grouped by day over the last $days days.
     *
     * @return array<int, array{date:string, count:int}>
     */
    public function reservationsPerDay(int $days = 14): array
    {
        $since = Carbon::today()->subDays($days - 1);

        $rows = Reservation::query()
            ->where('date', '>=', $since->toDateString())
            ->select('date', DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $since->copy()->addDays($i)->toDateString();
            $series[] = ['date' => $day, 'count' => (int) ($rows[$day] ?? 0)];
        }

        return $series;
    }

    /**
     * Top $limit most booked rooms.
     *
     * @return array<int, array{room_id:int, name:string, count:int}>
     */
    public function topRooms(int $limit = 5): array
    {
        return Reservation::query()
            ->join('rooms', 'rooms.id', '=', 'reservations.room_id')
            ->select('rooms.id as room_id', 'rooms.name as name', DB::raw('COUNT(*) as count'))
            ->groupBy('rooms.id', 'rooms.name')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'room_id' => (int) $r->room_id,
                'name' => $r->name,
                'count' => (int) $r->count,
            ])
            ->all();
    }

    /**
     * Most active users by reservation count.
     *
     * @return array<int, array{user_id:int, name:string, count:int}>
     */
    public function topUsers(int $limit = 5): array
    {
        return Reservation::query()
            ->join('users', 'users.id', '=', 'reservations.user_id')
            ->select(
                'users.id as user_id',
                'users.firstname',
                'users.lastname',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('users.id', 'users.firstname', 'users.lastname')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'user_id' => (int) $r->user_id,
                'name' => trim("{$r->firstname} {$r->lastname}"),
                'count' => (int) $r->count,
            ])
            ->all();
    }
}
