<?php

namespace App\Logging;

use Monolog\Formatter\JsonFormatter;
use Monolog\LogRecord;

/**
 * Formats every log record as a single line of structured JSON tailored for
 * domain/application events, e.g.:
 *
 * {"timestamp":"2026-06-08T10:00:00Z","level":"info","event":"reservation_created","user_id":12,...}
 *
 * The Monolog message becomes the "event" key, while every context value is
 * promoted to a top-level field so the log is trivially queryable in rsyslog,
 * Loki, Elasticsearch, etc.
 */
class EventJsonFormatter extends JsonFormatter
{
    public function __construct()
    {
        parent::__construct(self::BATCH_MODE_NEWLINES, appendNewline: true);
    }

    public function format(LogRecord $record): string
    {
        $data = [
            'timestamp' => $record->datetime->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z'),
            'level' => strtolower($record->level->getName()),
            'event' => $record->message,
            'channel' => $record->channel,
        ];

        foreach ($record->context as $key => $value) {
            $data[$key] = $value;
        }

        if (count($record->extra) > 0) {
            $data['extra'] = $record->extra;
        }

        return $this->toJson($this->normalize($data), true).($this->appendNewline ? "\n" : '');
    }
}
