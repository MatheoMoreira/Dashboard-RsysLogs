<?php

namespace App\Http\Controllers;

use App\Http\Resources\EquipmentResource;
use App\Models\Equipment;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EquipmentController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EquipmentResource::collection(Equipment::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Room::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:equipment,name'],
        ]);

        $equipment = Equipment::create($data);

        return (new EquipmentResource($equipment))->response()->setStatusCode(201);
    }
}
