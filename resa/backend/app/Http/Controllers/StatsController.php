<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\StatsService;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function __construct(private readonly StatsService $stats)
    {
    }

    public function dashboard(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return response()->json([
            'globals' => $this->stats->globals(),
            'reservations_per_day' => $this->stats->reservationsPerDay(),
            'top_rooms' => $this->stats->topRooms(),
            'top_users' => $this->stats->topUsers(),
        ]);
    }
}
