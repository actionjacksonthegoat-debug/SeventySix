import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of, interval } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { StorageService } from "./storage.service";
import { ClientLogRequest } from "@infrastructure/models/client-log-request.model";
import { environment } from "@environments/environment";

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
export class ErrorQueueService
{
	private readonly storage: StorageService = inject(StorageService);
	private readonly http: HttpClient = inject(HttpClient);
	private readonly logEndpoint: string = `${environment.apiUrl}/logs/client/batch`;
	private readonly localStorageKey: string = "error-queue";

	// Queue management
	private queue: ClientLogRequest[] = [];
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

	constructor()
	{
		this.loadQueueFromStorage();

		// Start batch processing interval with automatic cleanup
		interval(this.batchInterval)
			.pipe(takeUntilDestroyed())
			.subscribe(() =>
			{
				this.processBatch();
			});
	}

	/**
	 * Enqueues an error for batch sending.
	 * Always logs to console for successfully enqueued errors (1:1 with DB).
	 * Never drops errors - relies on deduplication and circuit breaker for protection.
	 */
	enqueue(error: ClientLogRequest): void
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

		// Get batch (already in server format)
		const batch: ClientLogRequest[] = this.queue.slice(0, this.batchSize);

		// Send to server
		this.http
			.post(this.logEndpoint, batch, { observe: "response" })
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
		const stored: ClientLogRequest[] | null = this.storage.getItem<
			ClientLogRequest[]
		>(this.localStorageKey);
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
	 * Saves queue to localStorage.
	 */
	private saveQueueToStorage(): void
	{
		this.storage.setItem(this.localStorageKey, this.queue);
	}

	/**
	 * Generates a unique signature for an error for deduplication.
	 */
	private generateErrorSignature(error: ClientLogRequest): string
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
	private isDuplicate(error: ClientLogRequest): boolean
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
