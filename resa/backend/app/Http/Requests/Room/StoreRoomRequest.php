<?php

namespace App\Http\Requests\Room;

use App\Models\Room;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Room::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'building' => ['required', 'string', 'max:255'],
            'floor' => ['required', 'integer'],
            'capacity' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:2000'],
            'equipment' => ['sometimes', 'array'],
            'equipment.*' => ['integer', 'exists:equipment,id'],
        ];
    }
}
