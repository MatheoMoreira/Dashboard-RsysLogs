<?php

namespace App\Http\Middleware;

use App\Services\EventLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route group to ADMIN users, emitting a forbidden_action security
 * event on rejection.
 */
class EnsureUserIsAdmin
{
    public function __construct(private readonly EventLogger $logger)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            $this->logger->warning(EventLogger::FORBIDDEN_ACTION, [
                'reason' => 'admin_required',
                'url' => '/'.ltrim($request->path(), '/'),
            ]);

            abort(403, 'Action réservée aux administrateurs.');
        }

        return $next($request);
    }
}
