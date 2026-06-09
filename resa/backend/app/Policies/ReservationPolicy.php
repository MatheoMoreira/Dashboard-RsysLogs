<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;

class ReservationPolicy
{
    /** Admin sees all reservations; users use the "mine" endpoint. */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Reservation $reservation): bool
    {
        return $user->isAdmin() || $reservation->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Reservation $reservation): bool
    {
        return $user->isAdmin() || $reservation->user_id === $user->id;
    }

    public function cancel(User $user, Reservation $reservation): bool
    {
        return $user->isAdmin() || $reservation->user_id === $user->id;
    }
}
