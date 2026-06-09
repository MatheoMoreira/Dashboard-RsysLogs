<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('room')) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'building' => ['sometimes', 'required', 'string', 'max:255'],
            'floor' => ['sometimes', 'required', 'integer'],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:2000'],
            'equipment' => ['sometimes', 'array'],
            'equipment.*' => ['integer', 'exists:equipment,id'],
        ];
    }
}
