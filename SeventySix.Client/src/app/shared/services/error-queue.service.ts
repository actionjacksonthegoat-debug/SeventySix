import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { environment } from "@environments/environment";
import { CreateLogRequest } from "@shared/models";
import { DateService } from "@shared/services/date.service";
import { StorageService } from "@shared/services/storage.service";
import { catchError, interval, of } from "rxjs";

/**
 * Circuit breaker states.
 */
type CircuitState = "closed" | "open";

/**
 * Error queue service with circuit breaker pattern.
 * Queues client-side errors and sends them in batches to the server.
 * Implements localStorage persistence and circuit breaker to prevent error loops.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class ErrorQueueService
{
	/**
	 * Storage abstraction for persisting queued errors (SSR-safe).
	 * @type {StorageService}
	 * @private
	 * @readonly
	 */
	private readonly storage: StorageService =
		inject(StorageService);

	/**
	 * HTTP client used to send error batches to the server.
	 * @type {HttpClient}
	 * @private
	 * @readonly
	 */
	private readonly http: HttpClient =
		inject(HttpClient);

	/**
	 * Date service for timestamps and timing.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Endpoint used to POST error batches.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly logEndpoint: string =
		`${environment.apiUrl}/logs/client/batch`;

	/**
	 * Local storage key for the queued errors.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly localStorageKey: string = "error-queue";

	// Queue management
	/**
	 * In-memory error queue pending sending.
	 * @type {CreateLogRequest[]}
	 * @private
	 */
	private queue: CreateLogRequest[] = [];

	/**
	 * Number of items to send per batch.
	 * @type {number}
	 * @private
	 * @readonly
	 */
	private readonly batchSize: number =
		environment.logging.batchSize;

	/**
	 * Interval between batch sends in milliseconds.
	 * @type {number}
	 * @private
	 * @readonly
	 */
	private readonly batchInterval: number =
		environment.logging.batchInterval;

	// Circuit breaker
	/**
	 * Current circuit breaker state ('closed' or 'open').
	 * @type {CircuitState}
	 * @private
	 */
	private circuitBreakerState: CircuitState = "closed";

	/**
	 * Number of consecutive failures observed sending batches.
	 * @type {number}
	 * @private
	 */
	private consecutiveFailures: number = 0;

	/**
	 * Failure threshold after which circuit opens.
	 * @type {number}
	 * @private
	 * @readonly
	 */
	private readonly maxFailures: number =
		environment.logging.circuitBreakerThreshold;

	/**
	 * Duration the circuit stays open in milliseconds.
	 * @type {number}
	 * @private
	 * @readonly
	 */
	private readonly circuitOpenDuration: number =
		environment.logging.circuitBreakerTimeout;

	/**
	 * Timestamp when the circuit was opened.
	 * @type {number}
	 * @private
	 */
	private circuitBreakerOpenTime: number = 0;

	// Error deduplication
	/**
	 * Recent error signatures to prevent duplicate logs.
	 * @type {Map<string, number>}
	 * @private
	 */
	private recentErrors: Map<string, number> =
		new Map<string, number>(); // signature -> timestamp

	/**
	 * Deduplication window in milliseconds.
	 * @type {number}
	 * @private
	 * @readonly
	 */
	private readonly dedupeWindowMs: number = 5000; // 5 seconds

	/**
	 * Initialize ErrorQueueService and resume sending queued errors.
	 * Starts the periodic batch sender with automatic cleanup on destroy.
	 * @returns {void}
	 */
	constructor()
	{
		this.loadQueueFromStorage();

		// Start batch processing interval with automatic cleanup
		interval(this.batchInterval)
		.pipe(takeUntilDestroyed())
		.subscribe(
			() =>
			{
				this.processBatch();
			});
	}

	/**
	 * Enqueues an error for batch sending.
	 * Always logs to console for successfully enqueued errors (1:1 with DB).
	 * Never drops errors - relies on deduplication and circuit breaker for protection.
	 * @param {CreateLogRequest} error
	 * The error payload to enqueue for batch sending.
	 * @returns {void}
	 */
	enqueue(error: CreateLogRequest): void
	{
		// Check for duplicates
		if (this.isDuplicate(error))
		{
			// Silently skip duplicate
			return;
		}

		// Add to queue
		this.queue.push(error);

		// Log to console (1:1 with database logs)
		console.error("[Client Error]", error);

		// Persist to localStorage
		this.saveQueueToStorage();
	}

	/**
	 * Processes a batch of errors and sends to the server.
	 * @returns {void}
	 */
	private processBatch(): void
	{
		// Skip if circuit is open
		if (this.isCircuitOpen())
		{
			return;
		}

		// Skip if queue is empty
		if (this.queue.length === 0)
		{
			return;
		}

		// Get batch (already in server format)
		const batch: CreateLogRequest[] =
			this.queue.slice(0, this.batchSize);

		// Send to server
		this
		.http
		.post(this.logEndpoint, batch,
			{ observe: "response" })
		.pipe(
			catchError(
				(err) =>
				{
					// Handle failure
					this.handleBatchFailure(err);
					return of(null);
				}))
		.subscribe(
			(response) =>
			{
				// Success if we got any response (including 204 No Content)
				if (response !== null)
				{
					// Success - remove sent items from queue
					this.queue.splice(0, batch.length);
					this.saveQueueToStorage();
					this.resetCircuitBreaker();
				}
			});
	}

	/**
	 * Handles batch send failure and updates the circuit breaker state.
	 * @param {unknown} error
	 * The error returned from the HTTP request.
	 * @returns {void}
	 */
	private handleBatchFailure(error: unknown): void
	{
		console.error("Failed to send error batch to server:", error);

		this.consecutiveFailures++;

		if (this.consecutiveFailures >= this.maxFailures)
		{
			this.openCircuitBreaker();
		}
	}

	/**
	 * Opens the circuit breaker and records the open time.
	 * @returns {void}
	 */
	private openCircuitBreaker(): void
	{
		this.circuitBreakerState = "open";
		this.circuitBreakerOpenTime =
			this.dateService.nowTimestamp();
		console.error(
			"Circuit breaker opened. Pausing error logging for 30 seconds.");
	}

	/**
	 * Resets the circuit breaker to the closed state.
	 * @returns {void}
	 */
	private resetCircuitBreaker(): void
	{
		this.consecutiveFailures = 0;
		this.circuitBreakerState = "closed";
	}

	/**
	 * Checks whether the circuit breaker is currently open and closes it if the timeout elapsed.
	 * @returns {boolean}
	 * True when the circuit is open and preventing sends.
	 */
	private isCircuitOpen(): boolean
	{
		if (this.circuitBreakerState === "closed")
		{
			return false;
		}

		// Check if circuit should be closed (30 seconds elapsed)
		const elapsed: number =
			this.dateService.nowTimestamp() - this.circuitBreakerOpenTime;
		if (elapsed >= this.circuitOpenDuration)
		{
			this.circuitBreakerState = "closed";
			this.consecutiveFailures = 0;
			return false;
		}

		return true;
	}

	/**
	 * Loads the queued errors from localStorage into memory.
	 * @returns {void}
	 */
	private loadQueueFromStorage(): void
	{
		const stored: CreateLogRequest[] | null =
			this.storage.getItem<
				CreateLogRequest[]>(this.localStorageKey);
		if (stored)
		{
			this.queue = stored;
		}
		else
		{
			this.queue = [];
		}
	}

	/**
	 * Persists the in-memory queue to localStorage.
	 * @returns {void}
	 */
	private saveQueueToStorage(): void
	{
		this.storage.setItem(this.localStorageKey, this.queue);
	}

	/**
	 * Generates a unique signature for an error for deduplication.
	 * @param {CreateLogRequest} error
	 * The error payload to generate a signature from.
	 * @returns {string}
	 * A deterministic signature string used for deduplication.
	 */
	private generateErrorSignature(error: CreateLogRequest): string
	{
		const parts: string[] =
			[
				error.message,
				error.exceptionMessage || "",
				error.statusCode?.toString() || "",
				error.requestUrl || ""
			];

		// Include first 100 chars of stack trace for uniqueness
		const stackPreview: string =
			error.stackTrace?.substring(0, 100) || "";
		return `${parts.join("|")}|${stackPreview}`;
	}

	/**
	 * Checks if an error is a duplicate within the deduplication window and updates tracking.
	 * @param {CreateLogRequest} error
	 * The error payload to check.
	 * @returns {boolean}
	 * True when the error is considered a duplicate within the dedupe window.
	 */
	private isDuplicate(error: CreateLogRequest): boolean
	{
		const signature: string =
			this.generateErrorSignature(error);
		const now: number =
			this.dateService.nowTimestamp();
		const lastSeen: number | undefined =
			this.recentErrors.get(signature);

		if (lastSeen && now - lastSeen < this.dedupeWindowMs)
		{
			return true; // Duplicate within window
		}

		// Update tracking
		this.recentErrors.set(signature, now);

		// Cleanup old entries
		this.cleanupRecentErrors(now);

		return false;
	}

	/**
	 * Removes old error signatures from tracking to prevent memory leaks.
	 * @param {number} now
	 * Current timestamp used to evaluate staleness.
	 * @returns {void}
	 */
	private cleanupRecentErrors(now: number): void
	{
		for (const [signature, timestamp] of this.recentErrors.entries())
		{
			if (now - timestamp > this.dedupeWindowMs * 2)
			{
				this.recentErrors.delete(signature);
			}
		}
	}
}
