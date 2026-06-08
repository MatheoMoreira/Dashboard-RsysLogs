<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Central entry point for every structured application event.
 *
 * Each call produces a single JSON line on the "events" channel, automatically
 * enriched with the authenticated user, client IP, HTTP method/path and a
 * correlation id. Event names mirror the project specification so they can be
 * reliably matched/aggregated downstream in rsyslog.
 */
class EventLogger
{
    // Authentication
    public const USER_REGISTERED = 'user_registered';
    public const USER_LOGIN = 'user_login';
    public const USER_LOGOUT = 'user_logout';
    public const FAILED_LOGIN = 'failed_login';

    // Consultation
    public const ROOMS_LIST_VIEWED = 'rooms_list_viewed';
    public const ROOM_VIEWED = 'room_viewed';

    // Reservations
    public const RESERVATION_CREATED = 'reservation_created';
    public const RESERVATION_UPDATED = 'reservation_updated';
    public const RESERVATION_CANCELLED = 'reservation_cancelled';

    // Security
    public const UNAUTHORIZED_ACCESS = 'unauthorized_access';
    public const INVALID_TOKEN = 'invalid_token';
    public const FORBIDDEN_ACTION = 'forbidden_action';

    // Business rules
    public const DOUBLE_BOOKING_ATTEMPT = 'double_booking_attempt';
    public const ROOM_CAPACITY_EXCEEDED = 'room_capacity_exceeded';
    public const INVALID_RESERVATION_PERIOD = 'invalid_reservation_period';

    // System
    public const DATABASE_ERROR = 'database_error';
    public const UNHANDLED_EXCEPTION = 'unhandled_exception';

    // HTTP access
    public const HTTP_REQUEST = 'http_request';

    /**
     * @param array<string, mixed> $context
     */
    public function log(string $event, array $context = [], string $level = 'info'): void
    {
        Log::channel('events')->log($level, $event, array_merge($this->baseContext(), $context));
    }

    /**
     * @param array<string, mixed> $context
     */
    public function info(string $event, array $context = []): void
    {
        $this->log($event, $context, 'info');
    }

    /**
     * @param array<string, mixed> $context
     */
    public function warning(string $event, array $context = []): void
    {
        $this->log($event, $context, 'warning');
    }

    /**
     * @param array<string, mixed> $context
     */
    public function error(string $event, array $context = []): void
    {
        $this->log($event, $context, 'error');
    }

    /**
     * Context attached to every event for correlation and observability.
     *
     * @return array<string, mixed>
     */
    protected function baseContext(): array
    {
        $request = request();

        return [
            'user_id' => Auth::id(),
            'ip' => $request?->ip(),
            'method' => $request?->method(),
            'path' => $request?->path() ? '/'.ltrim($request->path(), '/') : null,
            'request_id' => $request?->attributes->get('request_id'),
            'user_agent' => $request?->userAgent(),
        ];
    }
}
