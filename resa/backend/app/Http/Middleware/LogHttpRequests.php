<?php

namespace App\Http\Middleware;

use App\Services\EventLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Logs one structured JSON line per HTTP request (method, url, status, response
 * time, ip, authenticated user) and tags the request with a correlation id that
 * every other event in the request shares.
 */
class LogHttpRequests
{
    public function __construct(private readonly EventLogger $logger)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('request_id', (string) Str::uuid());
        $start = microtime(true);

        /** @var Response $response */
        $response = $next($request);

        $durationMs = round((microtime(true) - $start) * 1000, 2);
        $status = $response->getStatusCode();

        $this->logger->log(
            EventLogger::HTTP_REQUEST,
            [
                'http_method' => $request->method(),
                'url' => '/'.ltrim($request->path(), '/'),
                'status' => $status,
                'response_time_ms' => $durationMs,
            ],
            $this->levelFor($status),
        );

        return $response;
    }

    private function levelFor(int $status): string
    {
        return match (true) {
            $status >= 500 => 'error',
            $status >= 400 => 'warning',
            default => 'info',
        };
    }
}
