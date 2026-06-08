<?php

namespace App\Exceptions;

use App\Services\EventLogger;

class InvalidReservationPeriodException extends BusinessRuleException
{
    protected int $status = 422;

    protected string $errorCode = EventLogger::INVALID_RESERVATION_PERIOD;

    public function __construct(
        public readonly string $startTime,
        public readonly string $endTime,
    ) {
        parent::__construct("L'heure de fin doit être strictement postérieure à l'heure de début.");
    }

    public function context(): array
    {
        return [
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
        ];
    }
}
