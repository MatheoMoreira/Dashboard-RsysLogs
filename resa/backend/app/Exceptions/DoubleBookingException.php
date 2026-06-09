<?php

namespace App\Exceptions;

use App\Services\EventLogger;

class DoubleBookingException extends BusinessRuleException
{
    protected int $status = 409;

    protected string $errorCode = EventLogger::DOUBLE_BOOKING_ATTEMPT;

    public function __construct(
        public readonly int $roomId,
        public readonly string $date,
        public readonly string $startTime,
        public readonly string $endTime,
    ) {
        parent::__construct('Cette salle est déjà réservée sur ce créneau horaire.');
    }

    public function context(): array
    {
        return [
            'room_id' => $this->roomId,
            'date' => $this->date,
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
        ];
    }
}
