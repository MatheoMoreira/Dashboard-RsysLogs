<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Exceptions\CapacityExceededException;
use App\Exceptions\DoubleBookingException;
use App\Exceptions\InvalidReservationPeriodException;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;

class ReservationService
{
    public function __construct(private readonly EventLogger $logger)
    {
    }

    /**
     * Create a reservation after enforcing every business rule.
     *
     * @param array{date:string,start_time:string,end_time:string,purpose:string,participants:int} $data
     */
    public function create(User $user, Room $room, array $data): Reservation
    {
        $this->assertValidPeriod($data['start_time'], $data['end_time']);
        $this->assertWithinCapacity($room, (int) $data['participants']);
        $this->assertNoOverlap($room, $data['date'], $data['start_time'], $data['end_time']);

        // Success event (reservation_created) is emitted by ReservationObserver.
        return $room->reservations()->create([
            'user_id' => $user->id,
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'purpose' => $data['purpose'],
            'participants' => $data['participants'],
            'status' => ReservationStatus::ACTIVE,
        ]);
    }

    /**
     * Update an existing reservation, re-validating every business rule.
     *
     * @param array{date:string,start_time:string,end_time:string,purpose:string,participants:int} $data
     */
    public function update(Reservation $reservation, array $data): Reservation
    {
        $room = $reservation->room;

        $this->assertValidPeriod($data['start_time'], $data['end_time']);
        $this->assertWithinCapacity($room, (int) $data['participants']);
        $this->assertNoOverlap($room, $data['date'], $data['start_time'], $data['end_time'], $reservation->id);

        // Success event (reservation_updated) is emitted by ReservationObserver.
        $reservation->update([
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'purpose' => $data['purpose'],
            'participants' => $data['participants'],
        ]);

        return $reservation;
    }

    public function cancel(Reservation $reservation): Reservation
    {
        // Success event (reservation_cancelled) is emitted by ReservationObserver.
        $reservation->update(['status' => ReservationStatus::CANCELLED]);

        return $reservation;
    }

    private function assertValidPeriod(string $startTime, string $endTime): void
    {
        if (strcmp($endTime, $startTime) <= 0) {
            $this->logger->warning(EventLogger::INVALID_RESERVATION_PERIOD, [
                'start_time' => $startTime,
                'end_time' => $endTime,
            ]);

            throw new InvalidReservationPeriodException($startTime, $endTime);
        }
    }

    private function assertWithinCapacity(Room $room, int $participants): void
    {
        if ($participants > $room->capacity) {
            $this->logger->warning(EventLogger::ROOM_CAPACITY_EXCEEDED, [
                'room_id' => $room->id,
                'capacity' => $room->capacity,
                'participants' => $participants,
            ]);

            throw new CapacityExceededException($room->id, $room->capacity, $participants);
        }
    }

    private function assertNoOverlap(
        Room $room,
        string $date,
        string $startTime,
        string $endTime,
        ?int $ignoreReservationId = null,
    ): void {
        $overlaps = $room->reservations()
            ->active()
            ->whereDate('date', $date)
            ->when($ignoreReservationId, fn ($q) => $q->where('id', '!=', $ignoreReservationId))
            // Two intervals overlap when start < other.end AND end > other.start.
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();

        if ($overlaps) {
            $this->logger->warning(EventLogger::DOUBLE_BOOKING_ATTEMPT, [
                'room_id' => $room->id,
                'date' => $date,
                'start_time' => $startTime,
                'end_time' => $endTime,
            ]);

            throw new DoubleBookingException($room->id, $date, $startTime, $endTime);
        }
    }
}
