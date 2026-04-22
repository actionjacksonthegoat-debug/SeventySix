import { now } from "../date";
import { isNullOrUndefined, isPresent } from "../utils/null-check";

/** Maximum entries before an automatic flush. */
const BATCH_SIZE: number = 10;

/** Interval in milliseconds between automatic flushes. */
const FLUSH_INTERVAL_MS: number = 5000;

/** A structured log entry to forward to the SeventySix API. */
export interface LogEntry
{
	/** The severity level of the log entry. */
	logLevel: string;
	/** The log message. */
	message: string;
	/** The exception message, if applicable. */
	exceptionMessage?: string;
	/** The stack trace, if applicable. */
	stackTrace?: string;
	/** The request URL that triggered the log. */
	requestUrl?: string;
	/** The HTTP method of the request. */
	requestMethod?: string;
	/** W3C trace ID for distributed tracing correlation. */
	traceId?: string;
	/** W3C span ID for distributed tracing correlation. */
	spanId?: string;
}

/** Log levels that should be forwarded to the SeventySix API. */
const FORWARD_LEVELS: ReadonlySet<string> =
	new Set(
		["Warning", "Error", "Fatal"]);

/** The public API surface of a log forwarder instance. */
export interface LogForwarder
{
	/** Configures the API URL for log forwarding. */
	configureLogForwarder: (apiUrl: string) => void;
	/** Checks whether a log level should be forwarded. */
	shouldForwardLog: (level: string) => boolean;
	/** Formats a log entry for the SeventySix API. */
	formatLogEntry: (entry: LogEntry) => Record<string, unknown>;
	/** Forwards a batch of entries to the API. */
	forwardLogs: (entries: LogEntry[], apiUrl: string) => Promise<void>;
	/** Flushes the internal queue. */
	flush: () => Promise<void>;
	/** Queues a log entry for batched forwarding. */
	queueLog: (entry: LogEntry) => void;
	/** Resets internal state (testing only). */
	_resetForTesting: () => void;
}

/**
 * Creates a log forwarder instance scoped to the given source context.
 * Each instance maintains its own queue, timer, and API URL configuration.
 *
 * @param {string} sourceContext - The source context identifier (e.g., "seventysixcommerce-sveltekit").
 * @returns {LogForwarder} A log forwarder instance.
 */
export function createLogForwarder(sourceContext: string): LogForwarder
{
	let configuredApiUrl: string = "";
	let queue: LogEntry[] = [];
	let flushTimer: ReturnType<typeof setInterval> | undefined;

	/**
	 * Formats a LogEntry into the shape expected by the SeventySix CreateLogRequest API.
	 *
	 * @param {LogEntry} entry - The log entry to format.
	 * @returns {Record<string, unknown>} The formatted log entry.
	 */
	function formatLogEntry(entry: LogEntry): Record<string, unknown>
	{
		return {
			logLevel: entry.logLevel,
			message: entry.message,
			exceptionMessage: entry.exceptionMessage,
			stackTrace: entry.stackTrace,
			sourceContext,
			requestUrl: entry.requestUrl,
			requestMethod: entry.requestMethod,
			traceId: entry.traceId,
			spanId: entry.spanId,
			clientTimestamp: now()
				.toISOString()
		};
	}

	/**
	 * Forwards a batch of log entries to the SeventySix API.
	 * Silently handles failures — sandbox logs are non-critical.
	 *
	 * @param {LogEntry[]} entries - The log entries to forward.
	 * @param {string} apiUrl - The SeventySix API base URL.
	 */
	async function forwardLogs(entries: LogEntry[], apiUrl: string): Promise<void>
	{
		if (apiUrl === "" || entries.length === 0)
		{
			return;
		}

		try
		{
			await fetch(
				`${apiUrl}/api/v1/logs/client/batch`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(
						entries.map(
							(entry: LogEntry) =>
								formatLogEntry(entry)))
				});
		}
		catch
		{
			// Silently swallow — sandbox log forwarding is non-critical
		}
	}

	/**
	 * Flushes the internal log queue by forwarding all pending entries.
	 */
	async function flush(): Promise<void>
	{
		if (queue.length === 0)
		{
			return;
		}

		const entries: LogEntry[] =
			queue.splice(0);
		await forwardLogs(entries, configuredApiUrl);
	}

	return {
		configureLogForwarder(apiUrl: string): void
		{
			configuredApiUrl = apiUrl;
		},

		shouldForwardLog(level: string): boolean
		{
			return FORWARD_LEVELS.has(level);
		},

		formatLogEntry,

		forwardLogs,

		flush,

		queueLog(entry: LogEntry): void
		{
			queue.push(entry);

			if (isNullOrUndefined(flushTimer))
			{
				flushTimer =
					setInterval(
						() => void flush(),
						FLUSH_INTERVAL_MS);
			}

			if (queue.length >= BATCH_SIZE)
			{
				void flush();
			}
		},

		_resetForTesting(): void
		{
			queue = [];
			configuredApiUrl = "";

			if (isPresent(flushTimer))
			{
				clearInterval(flushTimer);
				flushTimer = undefined;
			}
		}
	};
}