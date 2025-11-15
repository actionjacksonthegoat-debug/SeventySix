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
	private readonly http: HttpClient = inject(HttpClient);
	private readonly logEndpoint: string = `${environment.apiUrl}/logs/client/batch`;
	private readonly localStorageKey: string = "error-queue";

	// Queue management
	private queue: QueuedError[] = [];
	private readonly batchSize: number = environment.logging.batchSize;
	private readonly batchInterval: number = environment.logging.batchInterval;

	// Circuit breaker
	private circuitBreakerState: CircuitState = "closed";
	private consecutiveFailures: number = 0;
	private readonly maxFailures: number =
		environment.logging.circuitBreakerThreshold;
	private readonly circuitOpenDuration: number =
		environment.logging.circuitBreakerTimeout;
	private circuitBreakerOpenTime: number = 0;

	// Error deduplication
	private recentErrors: Map<string, number> = new Map<string, number>(); // signature -> timestamp
	private readonly dedupeWindowMs: number = 5000; // 5 seconds

	// RxJS subscription for zoneless compatibility
	private batchProcessorSubscription?: Subscription;

	constructor()
	{
		this.loadQueueFromStorage();
		this.startBatchProcessor();
	}

	/**
	 * Enqueues an error for batch sending.
	 * Always logs to console for successfully enqueued errors (1:1 with DB).
	 * Never drops errors - relies on deduplication and circuit breaker for protection.
	 */
	enqueue(error: QueuedError): void
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
		const batch: QueuedError[] = this.queue.slice(0, this.batchSize);

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
			.post(this.logEndpoint, payload, { observe: "response" })
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
		const elapsed: number = Date.now() - this.circuitBreakerOpenTime;
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
			const stored: string | null = localStorage.getItem(
				this.localStorageKey
			);
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

	/**
	 * Generates a unique signature for an error for deduplication.
	 */
	private generateErrorSignature(error: QueuedError): string
	{
		const parts: string[] = [
			error.message,
			error.exceptionMessage || "",
			error.statusCode?.toString() || "",
			error.requestUrl || ""
		];

		// Include first 100 chars of stack trace for uniqueness
		const stackPreview: string = error.stackTrace?.substring(0, 100) || "";
		return `${parts.join("|")}|${stackPreview}`;
	}

	/**
	 * Checks if an error is a duplicate within the deduplication window.
	 */
	private isDuplicate(error: QueuedError): boolean
	{
		const signature: string = this.generateErrorSignature(error);
		const now: number = Date.now();
		const lastSeen: number | undefined = this.recentErrors.get(signature);

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
