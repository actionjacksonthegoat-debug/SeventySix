import { Injectable, OnDestroy, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of, interval, Subscription } from "rxjs";
import { LogLevel } from "./logger.service";
import { environment } from "@environments/environment";

/**
 * Client error log entry for queue.
 */
export interface QueuedError
{
	logLevel: LogLevel;
	message: string;
	timestamp: Date | string;
	exceptionMessage?: string;
	stackTrace?: string;
	sourceContext?: string;
	requestUrl?: string;
	requestMethod?: string;
	statusCode?: number;
	userAgent?: string;
	additionalContext?: Record<string, unknown>;
}

/**
 * Client log request DTO matching server expectations.
 */
interface ClientLogRequest
{
	logLevel: string;
	message: string;
	exceptionMessage?: string;
	stackTrace?: string;
	sourceContext?: string;
	requestUrl?: string;
	requestMethod?: string;
	statusCode?: number;
	userAgent?: string;
	clientTimestamp?: string;
	additionalContext?: Record<string, unknown>;
}

/**
 * Circuit breaker states.
 */
type CircuitState = "closed" | "open";

/**
 * Error queue service with circuit breaker pattern.
 * Queues client-side errors and sends them in batches to the server.
 * Implements localStorage persistence and circuit breaker to prevent error loops.
 */
@Injectable({
	providedIn: "root"
})
export class ErrorQueueService implements OnDestroy
{
	private readonly http = inject(HttpClient);
	private readonly logEndpoint = "/api/logs/client/batch";
	private readonly localStorageKey = "error-queue";

	// Queue management
	private queue: QueuedError[] = [];
	private readonly maxQueueSize = environment.logging.maxQueueSize;
	private readonly batchSize = environment.logging.batchSize;
	private readonly batchInterval = environment.logging.batchInterval;

	// Circuit breaker
	private circuitBreakerState: CircuitState = "closed";
	private consecutiveFailures = 0;
	private readonly maxFailures = environment.logging.circuitBreakerThreshold;
	private readonly circuitOpenDuration =
		environment.logging.circuitBreakerTimeout;
	private circuitBreakerOpenTime = 0;

	// RxJS subscription for zoneless compatibility
	private batchProcessorSubscription?: Subscription;

	constructor()
	{
		this.loadQueueFromStorage();
		this.startBatchProcessor();
	} /**
	 * Enqueues an error for batch sending.
	 * Always logs to console as fallback.
	 */
	enqueue(error: QueuedError): void
	{
		// Always log to console
		console.error("[Client Error]", error);

		// Check queue size
		if (this.queue.length >= this.maxQueueSize)
		{
			console.error("Error queue is full. Dropping error:", error);
			return;
		}

		// Add to queue
		this.queue.push(error);

		// Persist to localStorage
		this.saveQueueToStorage();
	}

	/**
	 * Cleanup on service destroy.
	 */
	ngOnDestroy(): void
	{
		if (this.batchProcessorSubscription)
		{
			this.batchProcessorSubscription.unsubscribe();
		}
	}

	/**
	 * Starts the batch processing interval using RxJS for zoneless compatibility.
	 */
	private startBatchProcessor(): void
	{
		this.batchProcessorSubscription = interval(
			this.batchInterval
		).subscribe(() =>
		{
			this.processBatch();
		});
	}

	/**
	 * Processes a batch of errors.
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

		// Get batch
		const batch = this.queue.slice(0, this.batchSize);

		// Convert to server format
		const payload: ClientLogRequest[] = batch.map((error) => ({
			logLevel: LogLevel[error.logLevel],
			message: error.message,
			exceptionMessage: error.exceptionMessage,
			stackTrace: error.stackTrace,
			sourceContext: error.sourceContext,
			requestUrl: error.requestUrl,
			requestMethod: error.requestMethod,
			statusCode: error.statusCode,
			userAgent: error.userAgent ?? navigator.userAgent,
			clientTimestamp:
				typeof error.timestamp === "string"
					? error.timestamp
					: error.timestamp.toISOString(),
			additionalContext: error.additionalContext
		}));

		// Send to server
		this.http
			.post(this.logEndpoint, payload)
			.pipe(
				catchError((err) =>
				{
					// Handle failure
					this.handleBatchFailure(err);
					return of(null);
				})
			)
			.subscribe((response) =>
			{
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
	 * Handles batch send failure.
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
	 * Opens the circuit breaker.
	 */
	private openCircuitBreaker(): void
	{
		this.circuitBreakerState = "open";
		this.circuitBreakerOpenTime = Date.now();
		console.error(
			"Circuit breaker opened. Pausing error logging for 30 seconds."
		);
	}

	/**
	 * Resets the circuit breaker.
	 */
	private resetCircuitBreaker(): void
	{
		this.consecutiveFailures = 0;
		this.circuitBreakerState = "closed";
	}

	/**
	 * Checks if circuit breaker is open.
	 */
	private isCircuitOpen(): boolean
	{
		if (this.circuitBreakerState === "closed")
		{
			return false;
		}

		// Check if circuit should be closed (30 seconds elapsed)
		const elapsed = Date.now() - this.circuitBreakerOpenTime;
		if (elapsed >= this.circuitOpenDuration)
		{
			this.circuitBreakerState = "closed";
			this.consecutiveFailures = 0;
			return false;
		}

		return true;
	}

	/**
	 * Loads queue from localStorage.
	 */
	private loadQueueFromStorage(): void
	{
		try
		{
			const stored = localStorage.getItem(this.localStorageKey);
			if (stored)
			{
				this.queue = JSON.parse(stored);
			}
		}
		catch (error)
		{
			console.error(
				"Failed to load error queue from localStorage:",
				error
			);
			this.queue = [];
		}
	}

	/**
	 * Saves queue to localStorage.
	 */
	private saveQueueToStorage(): void
	{
		try
		{
			localStorage.setItem(
				this.localStorageKey,
				JSON.stringify(this.queue)
			);
		}
		catch (error)
		{
			console.error("Failed to save error queue to localStorage:", error);
		}
	}
}
