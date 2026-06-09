<?php

namespace Database\Factories;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = fake()->numberBetween(8, 17);
        $duration = fake()->randomElement([1, 1, 2]);

        return [
            'room_id' => Room::factory(),
            'user_id' => User::factory(),
            'date' => fake()->dateTimeBetween('-10 days', '+10 days')->format('Y-m-d'),
            'start_time' => sprintf('%02d:00', $start),
            'end_time' => sprintf('%02d:00', min($start + $duration, 18)),
            'purpose' => fake()->randomElement([
                'Réunion équipe', 'Point projet', 'Entretien candidat', 'Formation',
                'Atelier design', 'Comité de pilotage', 'Daily stand-up', 'Démonstration client',
            ]),
            'participants' => fake()->numberBetween(2, 8),
            'status' => fake()->boolean(85) ? ReservationStatus::ACTIVE : ReservationStatus::CANCELLED,
        ];
    }
}
