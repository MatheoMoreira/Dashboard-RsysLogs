<?php

namespace App\Observers;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use App\Services\EventLogger;

/**
 * Emits the structured success events for reservations at the persistence
 * layer, keeping the ReservationService focused on business-rule enforcement.
 */
class ReservationObserver
{
    public function __construct(private readonly EventLogger $logger)
    {
    }

    public function created(Reservation $reservation): void
    {
        $this->logger->info(EventLogger::RESERVATION_CREATED, [
            'reservation_id' => $reservation->id,
            'room_id' => $reservation->room_id,
            'date' => $reservation->date->toDateString(),
            'start_time' => substr((string) $reservation->start_time, 0, 5),
            'end_time' => substr((string) $reservation->end_time, 0, 5),
            'participants' => $reservation->participants,
        ]);
    }

    public function updated(Reservation $reservation): void
    {
        // A status flip to CANCELLED is semantically a cancellation, not an edit.
        if ($reservation->wasChanged('status') && $reservation->status === ReservationStatus::CANCELLED) {
            $this->logger->info(EventLogger::RESERVATION_CANCELLED, [
                'reservation_id' => $reservation->id,
                'room_id' => $reservation->room_id,
            ]);

            return;
        }

        $this->logger->info(EventLogger::RESERVATION_UPDATED, [
            'reservation_id' => $reservation->id,
            'room_id' => $reservation->room_id,
        ]);
    }
}
