<?php

namespace Database\Factories;

use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Room>
 */
class RoomFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Salle '.fake()->unique()->randomElement([
                'Mercure', 'Vénus', 'Mars', 'Jupiter', 'Saturne', 'Uranus',
                'Neptune', 'Orion', 'Andromède', 'Cassiopée', 'Pégase', 'Lyra',
            ]),
            'building' => fake()->randomElement(['Bâtiment A', 'Bâtiment B', 'Bâtiment C']),
            'floor' => fake()->numberBetween(0, 5),
            'capacity' => fake()->randomElement([4, 6, 8, 10, 12, 20, 30]),
            'description' => fake()->sentence(10),
        ];
    }
}
