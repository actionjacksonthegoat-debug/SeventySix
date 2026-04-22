import { describe, expect, it } from "vitest";
import { generateTraceContext, parseTraceparent } from "../traceparent";
import type { TraceContext } from "../traceparent";

describe("parseTraceparent",
	() =>
	{
		it("should parse a valid traceparent header",
			() =>
			{
				const header: string = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

				const result: TraceContext | undefined =
					parseTraceparent(header);

				expect(result)
					.toEqual(
						{
							traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
							spanId: "00f067aa0ba902b7"
						});
			});

		it("should return undefined for null",
			() =>
			{
				expect(parseTraceparent(null))
					.toBeUndefined();
			});

		it("should return undefined for undefined",
			() =>
			{
				expect(parseTraceparent(undefined))
					.toBeUndefined();
			});

		it("should return undefined for empty string",
			() =>
			{
				expect(parseTraceparent(""))
					.toBeUndefined();
			});

		it("should return undefined for malformed header",
			() =>
			{
				expect(parseTraceparent("not-a-traceparent"))
					.toBeUndefined();
			});

		it("should return undefined for wrong version",
			() =>
			{
				const header: string = "01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

				expect(parseTraceparent(header))
					.toBeUndefined();
			});

		it("should return undefined for short trace ID",
			() =>
			{
				const header: string = "00-4bf92f3577b34da6-00f067aa0ba902b7-01";

				expect(parseTraceparent(header))
					.toBeUndefined();
			});
	});

describe("generateTraceContext",
	() =>
	{
		it("should return a 32-char hex trace ID",
			() =>
			{
				const context: TraceContext =
					generateTraceContext();

				expect(context.traceId)
					.toMatch(/^[0-9a-f]{32}$/);
			});

		it("should return a 16-char hex span ID",
			() =>
			{
				const context: TraceContext =
					generateTraceContext();

				expect(context.spanId)
					.toMatch(/^[0-9a-f]{16}$/);
			});

		it("should generate unique values on each call",
			() =>
			{
				const a: TraceContext =
					generateTraceContext();
				const b: TraceContext =
					generateTraceContext();

				expect(a.traceId).not.toBe(b.traceId);
			});
	});