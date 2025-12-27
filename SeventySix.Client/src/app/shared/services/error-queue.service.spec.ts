import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { CreateLogRequest } from "@shared/models";
import { delay } from "@shared/testing";
import { vi } from "vitest";
import { DateService } from "./date.service";
import { ErrorQueueService } from "./error-queue.service";

describe("ErrorQueueService (Zoneless)",
	() =>
	{
		let service: ErrorQueueService;
		let httpMock: HttpTestingController;
		let dateService: DateService;
		const BATCH_INTERVAL: number =
			environment.logging.batchInterval; // Use environment config
		const API_BATCH_URL: string =
			`${environment.apiUrl}/logs/client/batch`; // Dynamic URL from environment
		let consoleSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(
			() =>
			{
				// Clear localStorage before each test
				localStorage.clear();

				// Suppress console.error output during tests while still allowing verification
				consoleSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(
							() =>
							{});

				// Mock environment configuration for faster tests
				vi
					.spyOn(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(window as any).navigator,
						"userAgent",
						"get")
					.mockReturnValue("TestBrowser/1.0");

				TestBed.configureTestingModule(
					{
						providers: [
							provideHttpClient(),
							provideHttpClientTesting(),
							provideZonelessChangeDetection()
						]
					});

				service =
					TestBed.inject(ErrorQueueService);
				httpMock =
					TestBed.inject(HttpTestingController);
				dateService =
					TestBed.inject(DateService);

			// The service will use environment.logging.batchInterval (250ms in tests)
			// This provides fast tests while preventing race conditions
			});

		afterEach(
			() =>
			{
				// Verify no outstanding HTTP requests
				httpMock.verify();

				// Cleanup service

				// Clear localStorage
				localStorage.clear();
			});

		describe("Basic Queue Operations",
			() =>
			{
				it("should be created",
					() =>
					{
						expect(service)
							.toBeTruthy();
					});

				it("should enqueue an error",
					() =>
					{
						const error: CreateLogRequest =
							{
								logLevel: "Error",
								message: "Test error",
								clientTimestamp: dateService.now()
							};

						service.enqueue(error);

						// Should log to console for every enqueued error (1:1 with DB)
						expect(console.error)
							.toHaveBeenCalledWith("[Client Error]", error);
					});

				it("should save enqueued errors to localStorage",
					() =>
					{
						const error: CreateLogRequest =
							{
								logLevel: "Error",
								message: "Test error",
								clientTimestamp: dateService.now()
							};

						service.enqueue(error);

						const stored: string | null =
							localStorage.getItem("error-queue");
						expect(stored)
							.toBeTruthy();

						const parsed: CreateLogRequest[] =
							JSON.parse(stored!);
						expect(parsed.length)
							.toBe(1);
						expect(parsed[0].message)
							.toBe("Test error");
					});

				it("should load queue from localStorage on initialization",
					async () =>
					{
						// Pre-populate localStorage
						const existingErrors: CreateLogRequest[] =
							[
								{
									logLevel: "Warning",
									message: "Persisted error",
									clientTimestamp: dateService.now()
								}
							];
						localStorage.setItem("error-queue", JSON.stringify(existingErrors));

						// Destroy current service and create new one via TestBed

						// Clear TestBed and recreate to get fresh service instance
						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideHttpClient(),
									provideHttpClientTesting(),
									provideZonelessChangeDetection()
								]
							});

						TestBed.inject(ErrorQueueService);
						const newHttpMock: HttpTestingController =
							TestBed.inject(
								HttpTestingController);

						// Service will use environment.logging.batchInterval (250ms in tests)

						// Wait for batch processor to attempt sending
						await delay(BATCH_INTERVAL + 50);

						const req: ReturnType<typeof newHttpMock.expectOne> =
							newHttpMock.expectOne(API_BATCH_URL);
						expect(req.request.body.length)
							.toBe(1);
						expect(req.request.body[0].message)
							.toBe("Persisted error");
						req.flush({});
						newHttpMock.verify();
					});
			});

		describe("Batch Processing (Zoneless)",
			() =>
			{
				it("should send batch after interval",
					async () =>
					{
						const error: CreateLogRequest =
							{
								logLevel: "Error",
								message: "Batch test",
								clientTimestamp: dateService.now()
							};

						service.enqueue(error);

						// Wait for batch interval
						await delay(BATCH_INTERVAL + 50);

						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(API_BATCH_URL);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.body.length)
							.toBe(1);
						expect(req.request.body[0].message)
							.toBe("Batch test");

						req.flush({});
					});

				it("should not send empty batches",
					async () =>
					{
						// Don't enqueue anything, just wait
						await delay(BATCH_INTERVAL + 50);

						// Verify no HTTP requests were made
						httpMock.expectNone(API_BATCH_URL);

						// Ensure we have a passing expectation
						expect(true)
							.toBe(true);
					});

				it("should send maximum 10 items per batch",
					async () =>
					{
						// Enqueue 15 errors
						for (let i: number = 0; i < 15; i++)
						{
							service.enqueue(
								{
									logLevel: "Error",
									message: `Error ${i}`,
									clientTimestamp: dateService.now()
								});
						}

						// First batch should have 10 items
						await delay(BATCH_INTERVAL + 50);

						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(API_BATCH_URL);
						expect(req.request.body.length)
							.toBe(10);
						req.flush({});

						// Second batch should have 5 items
						await delay(BATCH_INTERVAL + 50);

						const req2: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(API_BATCH_URL);
						expect(req2.request.body.length)
							.toBe(5);
						req2.flush({});
					});

				it("should remove sent items from queue after successful send",
					async () =>
					{
						service.enqueue(
							{
								logLevel: "Error",
								message: "Test 1",
								clientTimestamp: dateService.now()
							});

						service.enqueue(
							{
								logLevel: "Error",
								message: "Test 2",
								clientTimestamp: dateService.now()
							});

						await delay(BATCH_INTERVAL + 50);

						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(API_BATCH_URL);
						expect(req.request.body.length)
							.toBe(2);

						// Successful response
						req.flush({});

						// Verify localStorage is cleared
						await delay(50);

						const stored: string | null =
							localStorage.getItem("error-queue");
						const parsed: CreateLogRequest[] =
							stored ? JSON.parse(stored) : [];
						expect(parsed.length)
							.toBe(0);
					});

				it("should send errors in CreateLogRequest format",
					async () =>
					{
						const error: CreateLogRequest =
							{
								logLevel: "Error",
								message: "Conversion test",
								clientTimestamp: "2025-11-12T10:00:00.000Z",
								exceptionMessage: "Exception details",
								stackTrace: "Stack trace here",
								sourceContext: "TestComponent",
								requestUrl: "/test",
								requestMethod: "GET",
								statusCode: 500,
								userAgent: navigator.userAgent,
								additionalContext: { key: "value" }
							};

						service.enqueue(error);

						await delay(BATCH_INTERVAL + 50);

						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(API_BATCH_URL);
						const payload: CreateLogRequest =
							req.request.body[0];

						expect(payload.logLevel)
							.toBe("Error");
						expect(payload.message)
							.toBe("Conversion test");
						expect(payload.exceptionMessage)
							.toBe("Exception details");
						expect(payload.stackTrace)
							.toBe("Stack trace here");
						expect(payload.sourceContext)
							.toBe("TestComponent");
						expect(payload.requestUrl)
							.toBe("/test");
						expect(payload.requestMethod)
							.toBe("GET");
						expect(payload.statusCode)
							.toBe(500);
						expect(payload.clientTimestamp)
							.toBe(
								"2025-11-12T10:00:00.000Z");
						expect(payload.additionalContext)
							.toEqual(
								{ key: "value" });
						expect(payload.userAgent)
							.toBeTruthy();

						req.flush({});
					});
			});

		describe("LocalStorage Persistence (Zoneless)",
			() =>
			{
				it("should persist queue to localStorage",
					() =>
					{
						service.enqueue(
							{
								logLevel: "Error",
								message: "Persist test",
								clientTimestamp: dateService.now()
							});

						const stored: string | null =
							localStorage.getItem("error-queue");
						expect(stored)
							.toBeTruthy();

						const parsed: CreateLogRequest[] =
							JSON.parse(stored!);
						expect(parsed[0].message)
							.toBe("Persist test");
					});

				it("should handle localStorage errors gracefully",
					() =>
					{
						// Mock localStorage.setItem to throw an error
						const originalLocalStorage: Storage =
							window.localStorage;
						const mockStorage: Storage =
							{
								length: 0,
								key: () => null,
								getItem: (key: string) =>
									originalLocalStorage.getItem(key),
								setItem: () =>
								{
									throw new Error("Storage full");
								},
								removeItem: (key: string) =>
									originalLocalStorage.removeItem(key),
								clear: () => originalLocalStorage.clear()
							};

						Object.defineProperty(
							window,
							"localStorage",
							{
								value: mockStorage,
								writable: true
							});

						service.enqueue(
							{
								logLevel: "Error",
								message: "Storage error test",
								clientTimestamp: dateService.now()
							});

						// Restore original localStorage
						Object.defineProperty(
							window,
							"localStorage",
							{
								value: originalLocalStorage,
								writable: true
							});

						// StorageService handles errors internally, logging to console.error
						const calls: unknown[][] =
							consoleSpy.mock.calls;
						const storageErrorCall: unknown[] | undefined =
							calls.find(
								(call) =>
									(call[0] as string)?.includes?.("StorageService"));
						expect(storageErrorCall)
							.toBeDefined();
					});

				it("should handle corrupted localStorage data",
					() =>
					{
						// Set corrupted data
						localStorage.setItem("error-queue", "invalid json {{{");

						// Destroy current service and create new one via TestBed

						// Clear TestBed and recreate to get fresh service instance
						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideHttpClient(),
									provideHttpClientTesting(),
									provideZonelessChangeDetection()
								]
							});

						const newService: ErrorQueueService =
							TestBed.inject(ErrorQueueService);

						// StorageService will return invalid JSON as a string, which won't match CreateLogRequest[]
						// The queue will be initialized as empty since getItem returns string, not array
						// Queue size is private, so just verify service was created successfully
						expect(newService)
							.toBeTruthy();
					});
			});

		describe("Error Deduplication",
			() =>
			{
				it("should deduplicate identical errors within time window",
					() =>
					{
						const error: CreateLogRequest =
							{
								logLevel: "Error",
								message: "Duplicate error",
								clientTimestamp: dateService.now(),
								exceptionMessage: "Same exception",
								statusCode: 500,
								requestUrl: "/api/test"
							};

						// Enqueue same error twice
						service.enqueue(error);
						service.enqueue(
							{ ...error });

						// Should only have 1 error in queue
						const queue: CreateLogRequest[] =
							(service as unknown as { queue: CreateLogRequest[]; }).queue;
						expect(queue.length)
							.toBe(1);
					});

				it("should allow different errors",
					() =>
					{
						const error1: CreateLogRequest =
							{
								logLevel: "Error",
								message: "Error 1",
								clientTimestamp: dateService.now()
							};

						const error2: CreateLogRequest =
							{
								logLevel: "Error",
								message: "Error 2",
								clientTimestamp: dateService.now()
							};

						service.enqueue(error1);
						service.enqueue(error2);

						// Should have both errors
						const queue: CreateLogRequest[] =
							(service as unknown as { queue: CreateLogRequest[]; }).queue;
						expect(queue.length)
							.toBe(2);
					});
			});
	});
