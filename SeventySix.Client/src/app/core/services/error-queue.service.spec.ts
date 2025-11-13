import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { ErrorQueueService, QueuedError } from "./error-queue.service";
import { LogLevel } from "./logger.service";
import { provideZonelessChangeDetection } from "@angular/core";

/**
 * Zoneless tests for ErrorQueueService
 * Uses manual timing control instead of fakeAsync/tick
 */
describe("ErrorQueueService (Zoneless)", () =>
{
	let service: ErrorQueueService;
	let httpMock: HttpTestingController;
	const BATCH_INTERVAL = 1000; // 1 second for tests
	let originalTimeout: number;
	let consoleSpy: jasmine.Spy;

	beforeEach(() =>
	{
		// Save original timeout
		originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

		// Clear localStorage before each test
		localStorage.clear();

		// Suppress console.error output during tests while still allowing verification
		consoleSpy = spyOn(console, "error");

		// Mock environment configuration for faster tests
		spyOnProperty(
			(window as any).navigator,
			"userAgent",
			"get"
		).and.returnValue("TestBrowser/1.0");

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideZonelessChangeDetection()
			]
		});

		service = TestBed.inject(ErrorQueueService);
		httpMock = TestBed.inject(HttpTestingController);

		// Override batch interval for testing by accessing private property
		// This is necessary because environment.logging.batchInterval is 5000ms
		(service as any).batchInterval = BATCH_INTERVAL;

		// Restart the batch processor with the new interval
		if ((service as any).batchProcessorSubscription)
		{
			(service as any).batchProcessorSubscription.unsubscribe();
		}
		(service as any).startBatchProcessor();
	});

	afterEach(() =>
	{
		// Reset timeout
		jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

		// Verify no outstanding HTTP requests
		httpMock.verify();

		// Cleanup service
		service.ngOnDestroy();

		// Clear localStorage
		localStorage.clear();
	});

	describe("Basic Queue Operations", () =>
	{
		it("should be created", () =>
		{
			expect(service).toBeTruthy();
		});

		it("should enqueue an error", () =>
		{
			const error: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Test error",
				timestamp: new Date()
			};

			service.enqueue(error);

			expect(console.error).toHaveBeenCalledWith("[Client Error]", error);
		});

		it("should save enqueued errors to localStorage", () =>
		{
			const error: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Test error",
				timestamp: new Date()
			};

			service.enqueue(error);

			const stored = localStorage.getItem("error-queue");
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed.length).toBe(1);
			expect(parsed[0].message).toBe("Test error");
		});

		it("should load queue from localStorage on initialization", (done) =>
		{
			// Pre-populate localStorage
			const existingErrors: QueuedError[] = [
				{
					logLevel: LogLevel.Warning,
					message: "Persisted error",
					timestamp: new Date().toISOString()
				}
			];
			localStorage.setItem("error-queue", JSON.stringify(existingErrors));

			// Destroy current service and create new one via TestBed
			service.ngOnDestroy();

			// Clear TestBed and recreate to get fresh service instance
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(),
					provideHttpClientTesting(),
					provideZonelessChangeDetection()
				]
			});

			const newService = TestBed.inject(ErrorQueueService);
			const newHttpMock = TestBed.inject(HttpTestingController);

			// Override batch interval for the new service instance
			(newService as any).batchInterval = BATCH_INTERVAL;
			if ((newService as any).batchProcessorSubscription)
			{
				(newService as any).batchProcessorSubscription.unsubscribe();
			}
			(newService as any).startBatchProcessor();

			// Wait for batch processor to attempt sending
			setTimeout(() =>
			{
				const req = newHttpMock.expectOne("/api/logs/client/batch");
				expect(req.request.body.length).toBe(1);
				expect(req.request.body[0].message).toBe("Persisted error");
				req.flush({});
				newHttpMock.verify();
				newService.ngOnDestroy();
				done();
			}, BATCH_INTERVAL + 100);
		});

		it("should not exceed max queue size", () =>
		{
			// Enqueue 101 errors (max is 100)
			for (let i = 0; i < 101; i++)
			{
				service.enqueue({
					logLevel: LogLevel.Error,
					message: `Error ${i}`,
					timestamp: new Date()
				});
			}

			// Verify error was logged for the 101st item
			const calls = consoleSpy.calls.all();
			const queueFullCall = calls.find((call) =>
				call.args[0]?.includes("queue is full")
			);
			expect(queueFullCall).toBeDefined();
		});
	});

	describe("Batch Processing (Zoneless)", () =>
	{
		it("should send batch after interval", (done) =>
		{
			const error: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Batch test",
				timestamp: new Date()
			};

			service.enqueue(error);

			// Wait for batch interval
			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				expect(req.request.method).toBe("POST");
				expect(req.request.body.length).toBe(1);
				expect(req.request.body[0].message).toBe("Batch test");

				req.flush({});
				done();
			}, BATCH_INTERVAL + 100);
		});

		it("should not send empty batches", (done) =>
		{
			// Don't enqueue anything, just wait
			setTimeout(() =>
			{
				// Verify no HTTP requests were made
				httpMock.expectNone("/api/logs/client/batch");

				// Ensure we have a passing expectation
				expect(true).toBe(true);
				done();
			}, BATCH_INTERVAL + 100);
		});

		it("should send maximum 10 items per batch", (done) =>
		{
			// Enqueue 15 errors
			for (let i = 0; i < 15; i++)
			{
				service.enqueue({
					logLevel: LogLevel.Error,
					message: `Error ${i}`,
					timestamp: new Date()
				});
			}

			// First batch should have 10 items
			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				expect(req.request.body.length).toBe(10);
				req.flush({});

				// Second batch should have 5 items
				setTimeout(() =>
				{
					const req2 = httpMock.expectOne("/api/logs/client/batch");
					expect(req2.request.body.length).toBe(5);
					req2.flush({});
					done();
				}, BATCH_INTERVAL + 100);
			}, BATCH_INTERVAL + 100);
		});

		it("should remove sent items from queue after successful send", (done) =>
		{
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Test 1",
				timestamp: new Date()
			});

			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Test 2",
				timestamp: new Date()
			});

			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				expect(req.request.body.length).toBe(2);

				// Successful response
				req.flush({});

				// Verify localStorage is cleared
				setTimeout(() =>
				{
					const stored = localStorage.getItem("error-queue");
					const parsed = stored ? JSON.parse(stored) : [];
					expect(parsed.length).toBe(0);
					done();
				}, 100);
			}, BATCH_INTERVAL + 100);
		});

		it("should convert QueuedError to ClientLogRequest format", (done) =>
		{
			const error: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Conversion test",
				timestamp: new Date("2025-11-12T10:00:00Z"),
				exceptionMessage: "Exception details",
				stackTrace: "Stack trace here",
				sourceContext: "TestComponent",
				requestUrl: "/test",
				requestMethod: "GET",
				statusCode: 500,
				additionalContext: { key: "value" }
			};

			service.enqueue(error);

			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				const payload = req.request.body[0];

				expect(payload.logLevel).toBe("Error");
				expect(payload.message).toBe("Conversion test");
				expect(payload.exceptionMessage).toBe("Exception details");
				expect(payload.stackTrace).toBe("Stack trace here");
				expect(payload.sourceContext).toBe("TestComponent");
				expect(payload.requestUrl).toBe("/test");
				expect(payload.requestMethod).toBe("GET");
				expect(payload.statusCode).toBe(500);
				expect(payload.clientTimestamp).toBe(
					"2025-11-12T10:00:00.000Z"
				);
				expect(payload.additionalContext).toEqual({ key: "value" });
				expect(payload.userAgent).toBeTruthy();

				req.flush({});
				done();
			}, BATCH_INTERVAL + 100);
		});
	});

	describe("Circuit Breaker (Zoneless)", () =>
	{
		beforeEach(() =>
		{
			// Circuit breaker tests need more time due to 5 sequential batch intervals
			jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
		});

		it("should open circuit breaker after 3 consecutive failures", (done) =>
		{
			// Circuit breaker threshold is 5 in environment config
			// Enqueue first error to trigger batch
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Failure test 0",
				timestamp: new Date()
			});

			let failureCount = 0;
			const maxFailures = 5; // Must match environment.logging.circuitBreakerThreshold

			const failNextBatch = () =>
			{
				setTimeout(() =>
				{
					const requests = httpMock.match("/api/logs/client/batch");
					if (requests.length > 0)
					{
						failureCount++;
						requests[0].error(new ProgressEvent("error"));

						if (failureCount < maxFailures)
						{
							// Enqueue another error to trigger next batch
							service.enqueue({
								logLevel: LogLevel.Error,
								message: `Failure test ${failureCount}`,
								timestamp: new Date()
							});
							failNextBatch();
						}
						else
						{
							// After maxFailures, wait for error handler to complete
							// The catchError operator processes asynchronously
							setTimeout(() =>
							{
								const calls = consoleSpy.calls.all();
								const circuitOpenCall = calls.find((call) =>
									call.args[0]?.includes(
										"Circuit breaker opened"
									)
								);
								expect(circuitOpenCall).toBeDefined();

								// Wait one more cycle to ensure no more batches are attempted
								// (circuit should be blocking them)
								setTimeout(() =>
								{
									httpMock.expectNone(
										"/api/logs/client/batch"
									);
									done();
								}, BATCH_INTERVAL + 200);
							}, 200);
						}
					}
				}, BATCH_INTERVAL + 100);
			};

			failNextBatch();
		});
		it("should not send batches when circuit is open", (done) =>
		{
			// Circuit breaker threshold is 5 in environment config
			// Enqueue first error to trigger batch
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Failure 0",
				timestamp: new Date()
			});

			// Fail 5 batches to open circuit
			let failureCount = 0;
			const maxFailures = 5; // Must match environment.logging.circuitBreakerThreshold

			const failBatches = () =>
			{
				setTimeout(() =>
				{
					const requests = httpMock.match("/api/logs/client/batch");
					if (requests.length > 0)
					{
						failureCount++;
						requests[0].error(new ProgressEvent("error"));

						if (failureCount < maxFailures)
						{
							// Enqueue another error to trigger next batch
							service.enqueue({
								logLevel: LogLevel.Error,
								message: `Failure ${failureCount}`,
								timestamp: new Date()
							});
							failBatches();
						}
						else
						{
							// Circuit is now open after 5 failures
							// Wait for the error handler to complete and circuit to open
							setTimeout(() =>
							{
								// Enqueue new error after circuit is confirmed open
								service.enqueue({
									logLevel: LogLevel.Error,
									message: "After circuit open",
									timestamp: new Date()
								});

								// Wait for next batch interval - should NOT send because circuit is open
								setTimeout(() =>
								{
									// Verify no requests were made (circuit blocked them)
									httpMock.expectNone(
										"/api/logs/client/batch"
									);

									// Ensure we have a passing expectation
									expect(true).toBe(true);
									done();
								}, BATCH_INTERVAL + 200);
							}, 200);
						}
					}
				}, BATCH_INTERVAL + 100);
			};

			failBatches();
		});
		it("should reset circuit breaker after successful send", (done) =>
		{
			// Enqueue errors
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Reset test",
				timestamp: new Date()
			});

			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				req.flush({}); // Success

				// Enqueue another error and verify it sends
				service.enqueue({
					logLevel: LogLevel.Error,
					message: "After reset",
					timestamp: new Date()
				});

				setTimeout(() =>
				{
					const req2 = httpMock.expectOne("/api/logs/client/batch");
					expect(req2.request.body[0].message).toBe("After reset");
					req2.flush({});
					done();
				}, BATCH_INTERVAL + 100);
			}, BATCH_INTERVAL + 100);
		});
	});

	describe("LocalStorage Persistence (Zoneless)", () =>
	{
		it("should persist queue to localStorage", () =>
		{
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Persist test",
				timestamp: new Date()
			});

			const stored = localStorage.getItem("error-queue");
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed[0].message).toBe("Persist test");
		});

		it("should handle localStorage errors gracefully", () =>
		{
			spyOn(localStorage, "setItem").and.throwError("Storage full");

			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Storage error test",
				timestamp: new Date()
			});

			const calls = consoleSpy.calls.all();
			const storageErrorCall = calls.find((call) =>
				call.args[0]?.includes("Failed to save error queue")
			);
			expect(storageErrorCall).toBeDefined();
		});

		it("should handle corrupted localStorage data", () =>
		{
			// Set corrupted data
			localStorage.setItem("error-queue", "invalid json {{{");

			// Destroy current service and create new one via TestBed
			service.ngOnDestroy();

			// Clear TestBed and recreate to get fresh service instance
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(),
					provideHttpClientTesting(),
					provideZonelessChangeDetection()
				]
			});

			const newService = TestBed.inject(ErrorQueueService);

			// Should have logged error and initialized empty queue
			expect(console.error).toHaveBeenCalledWith(
				jasmine.stringContaining("Failed to load error queue"),
				jasmine.anything()
			);

			newService.ngOnDestroy();
		});
	});

	describe("Edge Cases (Zoneless)", () =>
	{
		it("should handle timestamp as string", (done) =>
		{
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "String timestamp",
				timestamp: "2025-11-12T10:00:00.000Z"
			});

			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				expect(req.request.body[0].clientTimestamp).toBe(
					"2025-11-12T10:00:00.000Z"
				);
				req.flush({});
				done();
			}, BATCH_INTERVAL + 100);
		});

		it("should handle timestamp as Date object", (done) =>
		{
			const date = new Date("2025-11-12T10:00:00.000Z");
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Date timestamp",
				timestamp: date
			});

			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				expect(req.request.body[0].clientTimestamp).toBe(
					"2025-11-12T10:00:00.000Z"
				);
				req.flush({});
				done();
			}, BATCH_INTERVAL + 100);
		});

		it("should use navigator.userAgent when not provided", (done) =>
		{
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "User agent test",
				timestamp: new Date()
			});

			setTimeout(() =>
			{
				const req = httpMock.expectOne("/api/logs/client/batch");
				expect(req.request.body[0].userAgent).toBe(navigator.userAgent);
				req.flush({});
				done();
			}, BATCH_INTERVAL + 100);
		});

		it("should cleanup subscription on destroy", () =>
		{
			const subscription = (service as any).batchProcessorSubscription;
			expect(subscription).toBeDefined();
			expect(subscription.closed).toBe(false);

			service.ngOnDestroy();

			expect(subscription.closed).toBe(true);
		});
	});
});
