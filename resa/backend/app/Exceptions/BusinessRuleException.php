<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Base class for explicit, expected business-rule violations. These are
 * rendered as clean, consistent JSON API errors (never 500s) and carry the
 * structured event name that should be logged.
 */
abstract class BusinessRuleException extends RuntimeException
{
    /** HTTP status code returned to the client. */
    protected int $status = 422;

    /** Machine-readable error code (also used as the logged event name). */
    protected string $errorCode = 'business_rule_violation';

    public function status(): int
    {
        return $this->status;
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    /**
     * Extra structured context for both the API response and the logged event.
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return [];
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error' => $this->errorCode,
            'details' => $this->context(),
        ], $this->status);
    }
}
