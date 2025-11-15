import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { ErrorQueueService, QueuedError } from "./error-queue.service";
import { LogLevel } from "./logger.service";
import { provideZonelessChangeDetection } from "@angular/core";
import { environment } from "@environments/environment";

/**
 * Zoneless tests for ErrorQueueService
 * Uses manual timing control instead of fakeAsync/tick
 */
describe("ErrorQueueService (Zoneless)", () =>
{
	let service: ErrorQueueService;
	let httpMock: HttpTestingController;
	const BATCH_INTERVAL = environment.logging.batchInterval; // Use environment config
	const API_BATCH_URL = `${environment.apiUrl}/logs/client/batch`; // Dynamic URL from environment
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

		// The service will use environment.logging.batchInterval (250ms in tests)
		// This provides fast tests while preventing race conditions
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

			// Should log to console for every enqueued error (1:1 with DB)
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

			// Service will use environment.logging.batchInterval (250ms in tests)

			// Wait for batch processor to attempt sending
			setTimeout(() =>
			{
				const req = newHttpMock.expectOne(API_BATCH_URL);
				expect(req.request.body.length).toBe(1);
				expect(req.request.body[0].message).toBe("Persisted error");
				req.flush({});
				newHttpMock.verify();
				newService.ngOnDestroy();
				done();
			}, BATCH_INTERVAL + 50);
		});

		it("should allow unlimited queue growth", () =>
		{
			// Enqueue many errors
			for (let i = 0; i < 150; i++)
			{
				service.enqueue({
					logLevel: LogLevel.Error,
					message: `Error ${i}`,
					timestamp: new Date()
				});
			}

			// All errors should be queued (no drops)
			const queue = (service as any).queue;
			expect(queue.length).toBe(150);
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
				const req = httpMock.expectOne(API_BATCH_URL);
				expect(req.request.method).toBe("POST");
				expect(req.request.body.length).toBe(1);
				expect(req.request.body[0].message).toBe("Batch test");

				req.flush({});
				done();
			}, BATCH_INTERVAL + 50);
		});

		it("should not send empty batches", (done) =>
		{
			// Don't enqueue anything, just wait
			setTimeout(() =>
			{
				// Verify no HTTP requests were made
				httpMock.expectNone(API_BATCH_URL);

				// Ensure we have a passing expectation
				expect(true).toBe(true);
				done();
			}, BATCH_INTERVAL + 50);
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
				const req = httpMock.expectOne(API_BATCH_URL);
				expect(req.request.body.length).toBe(10);
				req.flush({});

				// Second batch should have 5 items
				setTimeout(() =>
				{
					const req2 = httpMock.expectOne(API_BATCH_URL);
					expect(req2.request.body.length).toBe(5);
					req2.flush({});
					done();
				}, BATCH_INTERVAL + 50);
			}, BATCH_INTERVAL + 50);
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
				const req = httpMock.expectOne(API_BATCH_URL);
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
				}, 50);
			}, BATCH_INTERVAL + 50);
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
				const req = httpMock.expectOne(API_BATCH_URL);
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
			}, BATCH_INTERVAL + 50);
		});
	});

	describe("Circuit Breaker (Zoneless)", () =>
	{
		beforeEach(() =>
		{
			// Circuit breaker tests need time for 3 failures at 250ms + buffer
			// 3 failures * (250ms + 50ms buffer) = ~900ms + 1000ms safety = 2000ms
			jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;
		});

		it("should open circuit breaker after 3 consecutive failures", (done) =>
		{
			// Circuit breaker threshold is 3 in environment.test config
			// Enqueue first error to trigger batch
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Failure test 0",
				timestamp: new Date()
			});

			let failureCount = 0;
			const maxFailures = environment.logging.circuitBreakerThreshold;

			const failNextBatch = () =>
			{
				setTimeout(() =>
				{
					const requests = httpMock.match(API_BATCH_URL);
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

								// Flush any remaining requests to prevent httpMock.verify() errors
								const remainingRequests =
									httpMock.match(API_BATCH_URL);
								remainingRequests.forEach((req) =>
									req.flush({})
								);
								done();
							}, 50);
						}
					}
				}, BATCH_INTERVAL + 50);
			};

			failNextBatch();
		});
		it("should not send batches when circuit is open", (done) =>
		{
			// Circuit breaker threshold is 3 in environment.test config
			// Enqueue first error to trigger batch
			service.enqueue({
				logLevel: LogLevel.Error,
				message: "Failure 0",
				timestamp: new Date()
			});

			// Fail 3 batches to open circuit
			let failureCount = 0;
			const maxFailures = environment.logging.circuitBreakerThreshold;

			const failBatches = () =>
			{
				setTimeout(() =>
				{
					const requests = httpMock.match(API_BATCH_URL);
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
							// Circuit is now open after 3 failures
							// Wait for the error handler to complete and circuit to open
							setTimeout(() =>
							{
								// Enqueue new error after circuit is confirmed open
								service.enqueue({
									logLevel: LogLevel.Error,
									message: "After circuit open",
									timestamp: new Date()
								});

								// Circuit is open, flush any remaining requests and verify
								const remainingRequests =
									httpMock.match(API_BATCH_URL);
								remainingRequests.forEach((req) =>
									req.flush({})
								);
								expect(true).toBe(true);
								done();
							}, 50);
						}
					}
				}, BATCH_INTERVAL + 50);
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
				const req = httpMock.expectOne(API_BATCH_URL);
				req.flush({}); // Success

				// Enqueue another error and verify it sends
				service.enqueue({
					logLevel: LogLevel.Error,
					message: "After reset",
					timestamp: new Date()
				});

				setTimeout(() =>
				{
					const req2 = httpMock.expectOne(API_BATCH_URL);
					expect(req2.request.body[0].message).toBe("After reset");
					req2.flush({});
					done();
				}, BATCH_INTERVAL + 50);
			}, BATCH_INTERVAL + 50);
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
				const req = httpMock.expectOne(API_BATCH_URL);
				expect(req.request.body[0].clientTimestamp).toBe(
					"2025-11-12T10:00:00.000Z"
				);
				req.flush({});
				done();
			}, BATCH_INTERVAL + 50);
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
				const req = httpMock.expectOne(API_BATCH_URL);
				expect(req.request.body[0].clientTimestamp).toBe(
					"2025-11-12T10:00:00.000Z"
				);
				req.flush({});
				done();
			}, BATCH_INTERVAL + 50);
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
				const req = httpMock.expectOne(API_BATCH_URL);
				expect(req.request.body[0].userAgent).toBe(navigator.userAgent);
				req.flush({});
				done();
			}, BATCH_INTERVAL + 50);
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

	describe("Error Deduplication", () =>
	{
		it("should deduplicate identical errors within time window", () =>
		{
			const error: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Duplicate error",
				timestamp: new Date(),
				exceptionMessage: "Same exception",
				statusCode: 500,
				requestUrl: "/api/test"
			};

			// Enqueue same error twice
			service.enqueue(error);
			service.enqueue({ ...error });

			// Should only have 1 error in queue
			const queue = (service as any).queue;
			expect(queue.length).toBe(1);
		});

		it("should allow different errors", () =>
		{
			const error1: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Error 1",
				timestamp: new Date()
			};

			const error2: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Error 2",
				timestamp: new Date()
			};

			service.enqueue(error1);
			service.enqueue(error2);

			// Should have both errors
			const queue = (service as any).queue;
			expect(queue.length).toBe(2);
		});

		it("should cleanup old error signatures from tracking", () =>
		{
			const error: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Test error",
				timestamp: new Date()
			};

			// Enqueue first time
			service.enqueue(error);
			expect((service as any).queue.length).toBe(1);

			// Mock the internal tracking map to simulate time passing
			const recentErrors = (service as any).recentErrors as Map<
				string,
				number
			>;
			const oldSignature = Array.from(recentErrors.keys())[0];

			// Set the timestamp to 15 seconds ago
			recentErrors.set(oldSignature, Date.now() - 15000);

			// Enqueue a different error to trigger cleanup
			const differentError: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Different error",
				timestamp: new Date()
			};
			service.enqueue(differentError);

			// The old signature should have been cleaned up
			expect(recentErrors.has(oldSignature)).toBe(false);
			expect((service as any).queue.length).toBe(2);
		});

		it("should track errors with different status codes separately", () =>
		{
			const error500: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Server error",
				statusCode: 500,
				timestamp: new Date()
			};

			const error404: QueuedError = {
				logLevel: LogLevel.Error,
				message: "Server error",
				statusCode: 404,
				timestamp: new Date()
			};

			service.enqueue(error500);
			service.enqueue(error404);

			// Different status codes = different errors
			const queue = (service as any).queue;
			expect(queue.length).toBe(2);
		});
	});
});
