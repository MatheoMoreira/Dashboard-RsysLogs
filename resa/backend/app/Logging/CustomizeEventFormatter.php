<?php

namespace App\Logging;

use Illuminate\Log\Logger;

/**
 * Monolog "tap" applying the {@see EventJsonFormatter} to every handler of a
 * channel. Referenced from config/logging.php.
 */
class CustomizeEventFormatter
{
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->setFormatter(new EventJsonFormatter());
        }
    }
}
