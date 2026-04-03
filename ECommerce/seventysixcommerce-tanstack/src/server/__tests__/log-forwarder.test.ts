import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LogEntry } from "~/server/log-forwarder";
import {
	_resetForTesting,
	configureLogForwarder,
	formatLogEntry,
	forwardLogs,
	queueLog,
	shouldForwardLog
} from "~/server/log-forwarder";

describe("log-forwarder",
	() =>
	{
		describe("shouldForwardLog",
			() =>
			{
				it("returns true for Warning level",
					() =>
					{
						expect(shouldForwardLog("Warning"))
							.toBe(true);
					});

				it("returns true for Error level",
					() =>
					{
						expect(shouldForwardLog("Error"))
							.toBe(true);
					});

				it("returns true for Fatal level",
					() =>
					{
						expect(shouldForwardLog("Fatal"))
							.toBe(true);
					});

				it("returns false for Info level",
					() =>
					{
						expect(shouldForwardLog("Info"))
							.toBe(false);
					});

				it("returns false for Debug level",
					() =>
					{
						expect(shouldForwardLog("Debug"))
							.toBe(false);
					});
			});

		describe("formatLogEntry",
			() =>
			{
				it("creates correct CreateLogRequest shape",
					() =>
					{
						const entry: LogEntry =
							{
								logLevel: "Error",
								message: "Test error",
								exceptionMessage: "Something failed",
								stackTrace: "at Module.test",
								requestUrl: "/shop",
								requestMethod: "GET"
							};

						const result: Record<string, unknown> =
							formatLogEntry(entry);

						expect(result)
							.toEqual(
								{
									logLevel: "Error",
									message: "Test error",
									exceptionMessage: "Something failed",
									stackTrace: "at Module.test",
									sourceContext: "seventysixcommerce-tanstack",
									requestUrl: "/shop",
									requestMethod: "GET",
									clientTimestamp: expect.any(String)
								});
					});
			});

		describe("forwardLogs",
			() =>
			{
				let originalFetch: typeof globalThis.fetch;

				beforeEach(
					() =>
					{
						originalFetch =
							globalThis.fetch;
					});

				afterEach(
					() =>
					{
						globalThis.fetch = originalFetch;
						vi.unstubAllEnvs();
					});

				it("sends batch POST to SeventySix API",
					async () =>
					{
						const mockFetch =
							vi
								.fn<typeof fetch>()
								.mockResolvedValue(
									{ ok: true } as Response);
						globalThis.fetch = mockFetch;

						const entries: LogEntry[] =
							[
								{
									logLevel: "Error",
									message: "Test error"
								}
							];

						await forwardLogs(entries, "http://localhost:7074");

						expect(mockFetch)
							.toHaveBeenCalledOnce();
						expect(mockFetch)
							.toHaveBeenCalledWith(
								"http://localhost:7074/api/v1/logs/client/batch",
								expect.objectContaining(
									{
										method: "POST",
										headers: { "Content-Type": "application/json" }
									}));

						const body: string =
							mockFetch.mock.calls[0][1]!.body as string;
						const parsed: Record<string, unknown>[] =
							JSON.parse(body);

						expect(parsed)
							.toHaveLength(1);
						expect(parsed[0].sourceContext)
							.toBe("seventysixcommerce-tanstack");
					});

				it("sets SourceContext to 'seventysixcommerce-tanstack'",
					async () =>
					{
						const mockFetch =
							vi
								.fn<typeof fetch>()
								.mockResolvedValue(
									{ ok: true } as Response);
						globalThis.fetch = mockFetch;

						await forwardLogs(
							[{ logLevel: "Warning", message: "warn" }],
							"http://localhost:7074");

						const body: string =
							mockFetch.mock.calls[0][1]!.body as string;
						const parsed: Record<string, unknown>[] =
							JSON.parse(body);

						expect(parsed[0].sourceContext)
							.toBe("seventysixcommerce-tanstack");
					});

				it("handles API errors gracefully (does not throw)",
					async () =>
					{
						globalThis.fetch =
							vi
								.fn<typeof fetch>()
								.mockRejectedValue(new Error("Network error")) as typeof fetch;

						await expect(
							forwardLogs(
								[{ logLevel: "Error", message: "test" }],
								"http://localhost:7074"))
							.resolves
							.toBeUndefined();
					});

				it("does nothing when apiUrl is empty",
					async () =>
					{
						const mockFetch =
							vi
								.fn<typeof fetch>()
								.mockResolvedValue(
									{ ok: true } as Response);
						globalThis.fetch = mockFetch;

						await forwardLogs(
							[{ logLevel: "Error", message: "test" }],
							"");

						expect(mockFetch).not.toHaveBeenCalled();
					});
			});

		describe("queueLog",
			() =>
			{
				let originalFetch: typeof globalThis.fetch;

				beforeEach(
					() =>
					{
						originalFetch =
							globalThis.fetch;
						_resetForTesting();
					});

				afterEach(
					() =>
					{
						globalThis.fetch = originalFetch;
						_resetForTesting();
					});

				it("queues entries and flushes when batch size reached",
					async () =>
					{
						const mockFetch =
							vi
								.fn<typeof fetch>()
								.mockResolvedValue(
									{ ok: true } as Response);
						globalThis.fetch = mockFetch;
						configureLogForwarder("http://localhost:7074");

						for (let i: number = 0; i < 10; i++)
						{
							queueLog(
								{
									logLevel: "Error",
									message: `error ${i}`
								});
						}

						await vi.waitFor(
							() =>
							{
								expect(mockFetch)
									.toHaveBeenCalledOnce();
							});
					});

				it("does not flush below batch size",
					() =>
					{
						const mockFetch =
							vi
								.fn<typeof fetch>()
								.mockResolvedValue(
									{ ok: true } as Response);
						globalThis.fetch = mockFetch;
						configureLogForwarder("http://localhost:7074");

						queueLog(
							{
								logLevel: "Error",
								message: "single entry"
							});

						expect(mockFetch).not.toHaveBeenCalled();
					});
			});
	});