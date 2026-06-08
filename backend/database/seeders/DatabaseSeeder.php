<?php

namespace Database\Seeders;

use App\Enums\ReservationStatus;
use App\Models\Equipment;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // --- Known accounts ----------------------------------------------
        $admin = User::factory()->admin()->create([
            'firstname' => 'Alice',
            'lastname' => 'Admin',
            'email' => 'admin@resa.test',
        ]);

        $user = User::factory()->create([
            'firstname' => 'Bob',
            'lastname' => 'User',
            'email' => 'user@resa.test',
        ]);

        $allUsers = User::factory()->count(8)->create()->push($user)->push($admin);

        // --- Equipment ----------------------------------------------------
        $equipment = collect([
            'TV', 'Visioconférence', 'Tableau blanc', 'Projecteur',
            'Système audio', 'Webcam 4K', 'Écran tactile',
        ])->map(fn (string $name) => Equipment::create(['name' => $name]));

        // --- Rooms --------------------------------------------------------
        $rooms = Room::factory()->count(10)->create();
        $rooms->each(fn (Room $room) => $room->equipment()->sync(
            $equipment->random(rand(1, 4))->pluck('id')->all()
        ));

        // --- Reservations: non-overlapping slots per room/day -------------
        $purposes = [
            'Réunion équipe', 'Point projet', 'Entretien candidat', 'Formation',
            'Atelier design', 'Comité de pilotage', 'Daily stand-up', 'Démonstration client',
        ];

        foreach ($rooms as $room) {
            for ($offset = -14; $offset <= 7; $offset++) {
                if (rand(0, 100) < 45) {
                    continue; // not every room is booked every day
                }

                $date = Carbon::today()->addDays($offset)->toDateString();
                $slotStart = 8;
                $slotsToday = rand(1, 3);

                for ($s = 0; $s < $slotsToday && $slotStart < 18; $s++) {
                    $end = min($slotStart + rand(1, 2), 18);

                    Reservation::factory()->create([
                        'room_id' => $room->id,
                        'user_id' => $allUsers->random()->id,
                        'date' => $date,
                        'start_time' => sprintf('%02d:00', $slotStart),
                        'end_time' => sprintf('%02d:00', $end),
                        'purpose' => $purposes[array_rand($purposes)],
                        'participants' => min(rand(2, 10), $room->capacity),
                        'status' => rand(0, 100) < 88
                            ? ReservationStatus::ACTIVE
                            : ReservationStatus::CANCELLED,
                    ]);

                    // Leave a gap so the next slot never overlaps.
                    $slotStart = $end + rand(0, 2);
                }
            }
        }
    }
}
