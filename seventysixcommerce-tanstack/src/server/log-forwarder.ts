import { now } from "~/lib/date";

/** The source context identifier for TanStack sandbox logs. */
const SOURCE_CONTEXT: string = "seventysixcommerce-tanstack";

/** Maximum entries before an automatic flush. */
const BATCH_SIZE: number = 10;

/** Interval in milliseconds between automatic flushes. */
const FLUSH_INTERVAL_MS: number = 5000;

/** Configured API URL for log forwarding. Empty string disables forwarding. */
let configuredApiUrl: string = "";

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
}

/** Log levels that should be forwarded to the SeventySix API. */
const FORWARD_LEVELS: ReadonlySet<string> =
	new Set(
		["Warning", "Error", "Fatal"]);

/** Internal queue of pending log entries. */
let queue: LogEntry[] = [];

/** Timer handle for the periodic flush. */
let flushTimer: ReturnType<typeof setInterval> | undefined;

/**
 * Configures the API URL for log forwarding.
 * Call once during server startup. Pass an empty string to disable forwarding.
 */
export function configureLogForwarder(apiUrl: string): void
{
	configuredApiUrl = apiUrl;
}

/**
 * Determines whether a log entry at the given level should be forwarded.
 * Only Warning, Error, and Fatal levels are forwarded.
 */
export function shouldForwardLog(level: string): boolean
{
	return FORWARD_LEVELS.has(level);
}

/**
 * Formats a LogEntry into the shape expected by the SeventySix CreateLogRequest API.
 * Adds the TanStack source context and a client timestamp.
 */
export function formatLogEntry(entry: LogEntry): Record<string, unknown>
{
	return {
		logLevel: entry.logLevel,
		message: entry.message,
		exceptionMessage: entry.exceptionMessage,
		stackTrace: entry.stackTrace,
		sourceContext: SOURCE_CONTEXT,
		requestUrl: entry.requestUrl,
		requestMethod: entry.requestMethod,
		clientTimestamp: now()
			.toISOString()
	};
}

/**
 * Forwards a batch of log entries to the SeventySix API.
 * Silently handles failures — sandbox logs are non-critical.
 * @param entries - The log entries to forward.
 * @param apiUrl - The SeventySix API base URL. If empty, forwarding is disabled.
 */
export async function forwardLogs(entries: LogEntry[], apiUrl: string): Promise<void>
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
					{
						requests: entries.map(
							(entry: LogEntry) =>
								formatLogEntry(entry))
					})
			});
	}
	catch
	{
		// Silently swallow — sandbox log forwarding is non-critical
	}
}

/**
 * Flushes the internal log queue by forwarding all pending entries.
 * Uses the API URL set via {@link configureLogForwarder}.
 */
export async function flush(): Promise<void>
{
	if (queue.length === 0)
	{
		return;
	}

	const entries: LogEntry[] =
		queue.splice(0);
	await forwardLogs(entries, configuredApiUrl);
}

/**
 * Queues a log entry for batched forwarding to the SeventySix API.
 * Automatically flushes when the batch reaches {@link BATCH_SIZE} entries.
 * Starts a periodic flush timer on the first call.
 */
export function queueLog(entry: LogEntry): void
{
	queue.push(entry);

	if (flushTimer === undefined)
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
}

/**
 * Resets the internal queue, stops the flush timer, and clears the API URL.
 * Exposed for testing only.
 */
export function _resetForTesting(): void
{
	queue = [];
	configuredApiUrl = "";

	if (flushTimer !== undefined)
	{
		clearInterval(flushTimer);
		flushTimer = undefined;
	}
}