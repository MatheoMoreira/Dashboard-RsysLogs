<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\JsonFormatter;

/**
 * Monolog "tap" turning a standard Laravel channel (e.g. the framework "single"
 * channel) into newline-delimited JSON, so *all* application logs — not only
 * domain events — are machine-parsable.
 */
class CustomizeJsonFormatter
{
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->setFormatter(new JsonFormatter(JsonFormatter::BATCH_MODE_NEWLINES, appendNewline: true));
        }
    }
}
