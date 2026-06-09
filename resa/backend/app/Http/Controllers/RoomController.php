<?php

namespace App\Http\Controllers;

use App\Http\Requests\Room\StoreRoomRequest;
use App\Http\Requests\Room\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use App\Services\EventLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RoomController extends Controller
{
    public function __construct(private readonly EventLogger $logger)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Room::class);

        $rooms = Room::query()
            ->withCount('reservations')
            ->with('equipment')
            ->orderBy('building')
            ->orderBy('name')
            ->get();

        $this->logger->info(EventLogger::ROOMS_LIST_VIEWED, ['count' => $rooms->count()]);

        return RoomResource::collection($rooms);
    }

    public function show(Room $room): RoomResource
    {
        $this->authorize('view', $room);

        $room->load('equipment')->loadCount('reservations');

        $this->logger->info(EventLogger::ROOM_VIEWED, ['room_id' => $room->id]);

        return new RoomResource($room);
    }

    public function store(StoreRoomRequest $request): JsonResource|JsonResponse
    {
        $room = Room::create($request->safe()->except('equipment'));
        $room->equipment()->sync($request->input('equipment', []));

        return (new RoomResource($room->load('equipment')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateRoomRequest $request, Room $room): RoomResource
    {
        $room->update($request->safe()->except('equipment'));

        if ($request->has('equipment')) {
            $room->equipment()->sync($request->input('equipment', []));
        }

        return new RoomResource($room->load('equipment'));
    }

    public function destroy(Room $room): JsonResponse
    {
        $this->authorize('delete', $room);

        $room->delete();

        return response()->json(['message' => 'Salle supprimée.']);
    }
}
