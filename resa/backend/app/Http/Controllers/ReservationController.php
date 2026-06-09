<?php

namespace App\Http\Controllers;

use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\Reservation\UpdateReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Room;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReservationController extends Controller
{
    public function __construct(private readonly ReservationService $reservations)
    {
    }

    /**
     * Admin: list every reservation, with optional filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Reservation::class);

        $reservations = Reservation::query()
            ->with(['room', 'user'])
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('room_id'), fn ($q) => $q->where('room_id', $request->integer('room_id')))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('date', $request->date('date')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('date')
            ->orderByDesc('start_time')
            ->paginate(20);

        return ReservationResource::collection($reservations);
    }

    /**
     * Reservations belonging to the authenticated user.
     */
    public function mine(Request $request): AnonymousResourceCollection
    {
        $reservations = $request->user()
            ->reservations()
            ->with(['room', 'user'])
            ->orderByDesc('date')
            ->orderByDesc('start_time')
            ->get();

        return ReservationResource::collection($reservations);
    }

    public function show(Reservation $reservation): ReservationResource
    {
        $this->authorize('view', $reservation);

        return new ReservationResource($reservation->load(['room', 'user']));
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        $this->authorize('create', Reservation::class);

        $room = Room::findOrFail($request->integer('room_id'));

        $reservation = $this->reservations->create(
            $request->user(),
            $room,
            $request->validated(),
        );

        return (new ReservationResource($reservation->load(['room', 'user'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation): ReservationResource
    {
        $this->authorize('update', $reservation);

        $reservation = $this->reservations->update($reservation, $request->validated());

        return new ReservationResource($reservation->load(['room', 'user']));
    }

    public function cancel(Reservation $reservation): ReservationResource
    {
        $this->authorize('cancel', $reservation);

        $reservation = $this->reservations->cancel($reservation);

        return new ReservationResource($reservation->load(['room', 'user']));
    }
}
