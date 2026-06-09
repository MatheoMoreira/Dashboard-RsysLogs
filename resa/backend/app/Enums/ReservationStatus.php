<?php

namespace App\Enums;

enum ReservationStatus: string
{
    case ACTIVE = 'ACTIVE';
    case CANCELLED = 'CANCELLED';
}
