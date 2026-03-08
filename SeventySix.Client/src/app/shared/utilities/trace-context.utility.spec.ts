import {
	describe,
	expect,
	it,
	vi
} from "vitest";

import * as otelApi from "@opentelemetry/api";

import { getTraceCorrelationId } from "./trace-context.utility";

describe("getTraceCorrelationId",
	() =>
	{
		it("should return a 32-character hex string",
			() =>
			{
				const result: string =
					getTraceCorrelationId();

				expect(result)
					.toMatch(/^[0-9a-f]{32}$/);
			});

		it("should return trace ID from active span when available",
			() =>
			{
				const expectedTraceId: string = "abcdef1234567890abcdef1234567890";
				vi
					.spyOn(otelApi.trace, "getActiveSpan")
					.mockReturnValue(
						{
							spanContext: () => ({
								traceId: expectedTraceId,
								spanId: "1234567890abcdef",
								traceFlags: 1
							})
						} as otelApi.Span);

				const result: string =
					getTraceCorrelationId();

				expect(result)
					.toBe(expectedTraceId);

				vi.restoreAllMocks();
			});

		it("should return random ID when no active span exists",
			() =>
			{
				vi
					.spyOn(otelApi.trace, "getActiveSpan")
					.mockReturnValue(undefined);

				const result: string =
					getTraceCorrelationId();

				expect(result)
					.toMatch(/^[0-9a-f]{32}$/);

				vi.restoreAllMocks();
			});

		it("should return random ID when trace ID is all zeros",
			() =>
			{
				const invalidTraceId: string = "00000000000000000000000000000000";
				vi
					.spyOn(otelApi.trace, "getActiveSpan")
					.mockReturnValue(
						{
							spanContext: () => ({
								traceId: invalidTraceId,
								spanId: "1234567890abcdef",
								traceFlags: 1
							})
						} as otelApi.Span);

				const result: string =
					getTraceCorrelationId();

				expect(result)
					.not
					.toBe(invalidTraceId);
				expect(result)
					.toMatch(/^[0-9a-f]{32}$/);

				vi.restoreAllMocks();
			});

		it("should return random ID when OTEL API throws",
			() =>
			{
				vi
					.spyOn(otelApi.trace, "getActiveSpan")
					.mockImplementation(
						() =>
						{
							throw new Error("OTEL not initialized");
						});

				const result: string =
					getTraceCorrelationId();

				expect(result)
					.toMatch(/^[0-9a-f]{32}$/);

				vi.restoreAllMocks();
			});

		it("should generate unique IDs on consecutive calls without active span",
			() =>
			{
				vi
					.spyOn(otelApi.trace, "getActiveSpan")
					.mockReturnValue(undefined);

				const id1: string =
					getTraceCorrelationId();
				const id2: string =
					getTraceCorrelationId();

				expect(id1)
					.not
					.toBe(id2);

				vi.restoreAllMocks();
			});
	});