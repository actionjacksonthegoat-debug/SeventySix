import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LogEntry, LogForwarder } from "../log-forwarder";
import { createLogForwarder } from "../log-forwarder";

describe("createLogForwarder",
	() =>
	{
		let forwarder: LogForwarder;

		beforeEach(
			() =>
			{
				forwarder =
					createLogForwarder("test-source");
			});

		afterEach(
			() =>
			{
				forwarder._resetForTesting();
				vi.restoreAllMocks();
			});

		describe("shouldForwardLog",
			() =>
			{
				it("returns true for Warning level",
					() =>
					{
						expect(forwarder.shouldForwardLog("Warning"))
							.toBe(true);
					});

				it("returns true for Error level",
					() =>
					{
						expect(forwarder.shouldForwardLog("Error"))
							.toBe(true);
					});

				it("returns true for Fatal level",
					() =>
					{
						expect(forwarder.shouldForwardLog("Fatal"))
							.toBe(true);
					});

				it("returns false for Info level",
					() =>
					{
						expect(forwarder.shouldForwardLog("Info"))
							.toBe(false);
					});

				it("returns false for Debug level",
					() =>
					{
						expect(forwarder.shouldForwardLog("Debug"))
							.toBe(false);
					});
			});

		describe("formatLogEntry",
			() =>
			{
				it("includes the configured source context",
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
							forwarder.formatLogEntry(entry);

						expect(result)
							.toEqual(
								{
									logLevel: "Error",
									message: "Test error",
									exceptionMessage: "Something failed",
									stackTrace: "at Module.test",
									sourceContext: "test-source",
									requestUrl: "/shop",
									requestMethod: "GET",
									clientTimestamp: expect.any(String)
								});
					});

				it("uses different source context per instance",
					() =>
					{
						const other: LogForwarder =
							createLogForwarder("other-source");

						const entry: LogEntry =
							{ logLevel: "Error", message: "test" };

						expect(forwarder.formatLogEntry(entry).sourceContext)
							.toBe("test-source");
						expect(other.formatLogEntry(entry).sourceContext)
							.toBe("other-source");

						other._resetForTesting();
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

						await forwarder.forwardLogs(entries, "http://localhost:7074");

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
							.toBe("test-source");
					});

				it("handles API errors gracefully",
					async () =>
					{
						globalThis.fetch =
							vi
								.fn<typeof fetch>()
								.mockRejectedValue(new Error("Network error")) as typeof fetch;

						await expect(
							forwarder.forwardLogs(
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

						await forwarder.forwardLogs(
							[{ logLevel: "Error", message: "test" }],
							"");

						expect(mockFetch)
							.not
							.toHaveBeenCalled();
					});

				it("does nothing when entries array is empty",
					async () =>
					{
						const mockFetch =
							vi
								.fn<typeof fetch>()
								.mockResolvedValue(
									{ ok: true } as Response);
						globalThis.fetch = mockFetch;

						await forwarder.forwardLogs(
							[],
							"http://localhost:7074");

						expect(mockFetch)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("queueLog and flush",
			() =>
			{
				let originalFetch: typeof globalThis.fetch;

				beforeEach(
					() =>
					{
						originalFetch =
							globalThis.fetch;
						globalThis.fetch =
							vi
								.fn<typeof fetch>()
								.mockResolvedValue(
									{ ok: true } as Response) as typeof fetch;
						forwarder.configureLogForwarder("http://localhost:7074");
					});

				afterEach(
					() =>
					{
						globalThis.fetch = originalFetch;
					});

				it("flushes queued entries",
					async () =>
					{
						forwarder.queueLog(
							{ logLevel: "Error", message: "queued" });

						await forwarder.flush();

						expect(globalThis.fetch)
							.toHaveBeenCalledOnce();
					});

				it("does not flush when queue is empty",
					async () =>
					{
						await forwarder.flush();

						expect(globalThis.fetch)
							.not
							.toHaveBeenCalled();
					});
			});
	});