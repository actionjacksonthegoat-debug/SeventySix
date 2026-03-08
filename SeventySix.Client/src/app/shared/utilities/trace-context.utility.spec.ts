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
		it("should return null when no active span exists",
			() =>
			{
				const result: string | null =
					getTraceCorrelationId();

				expect(result)
					.toBeNull();
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

				const result: string | null =
					getTraceCorrelationId();

				expect(result)
					.toBe(expectedTraceId);

				vi.restoreAllMocks();
			});

		it("should return null when active span is undefined",
			() =>
			{
				vi
					.spyOn(otelApi.trace, "getActiveSpan")
					.mockReturnValue(undefined);

				const result: string | null =
					getTraceCorrelationId();

				expect(result)
					.toBeNull();

				vi.restoreAllMocks();
			});

		it("should return null when trace ID is all zeros",
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

				const result: string | null =
					getTraceCorrelationId();

				expect(result)
					.toBeNull();

				vi.restoreAllMocks();
			});

		it("should return null when OTEL API throws",
			() =>
			{
				vi
					.spyOn(otelApi.trace, "getActiveSpan")
					.mockImplementation(
						() =>
						{
							throw new Error("OTEL not initialized");
						});

				const result: string | null =
					getTraceCorrelationId();

				expect(result)
					.toBeNull();

				vi.restoreAllMocks();
			});
	});