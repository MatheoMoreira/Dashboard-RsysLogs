<?php

namespace App\Exceptions;

use App\Services\EventLogger;

class CapacityExceededException extends BusinessRuleException
{
    protected int $status = 422;

    protected string $errorCode = EventLogger::ROOM_CAPACITY_EXCEEDED;

    public function __construct(
        public readonly int $roomId,
        public readonly int $capacity,
        public readonly int $participants,
    ) {
        parent::__construct(
            "Le nombre de participants ({$participants}) dépasse la capacité de la salle ({$capacity})."
        );
    }

    public function context(): array
    {
        return [
            'room_id' => $this->roomId,
            'capacity' => $this->capacity,
            'participants' => $this->participants,
        ];
    }
}
