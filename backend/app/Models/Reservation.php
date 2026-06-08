<?php

namespace App\Models;

use App\Enums\ReservationStatus;
use App\Observers\ReservationObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([ReservationObserver::class])]
class Reservation extends Model
{
    /** @use HasFactory<\Database\Factories\ReservationFactory> */
    use HasFactory;

    protected $fillable = [
        'room_id',
        'user_id',
        'date',
        'start_time',
        'end_time',
        'purpose',
        'participants',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'participants' => 'integer',
            'status' => ReservationStatus::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * @param Builder<Reservation> $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', ReservationStatus::ACTIVE->value);
    }
}
