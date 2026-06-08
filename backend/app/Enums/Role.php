<?php

namespace App\Enums;

enum Role: string
{
    case USER = 'USER';
    case ADMIN = 'ADMIN';

    public function isAdmin(): bool
    {
        return $this === self::ADMIN;
    }
}
