import { describe, expect, it, vi } from "vitest";
import { maskPii, toSafeLogPayload } from "../sanitize-error";
import type { SafeErrorPayload } from "../sanitize-error";

describe("toSafeLogPayload",
	() =>
	{
		it("returns generic message for Error instances",
			() =>
			{
				const error: Error =
					new Error("Connection string: host=db user=admin password=secret");

				const payload: SafeErrorPayload =
					toSafeLogPayload(error, "corr-123");

				expect(payload.message)
					.toBe("An internal error occurred");
				expect(payload.code)
					.toBe("RUNTIME_ERROR");
				expect(payload.correlationId)
					.toBe("corr-123");
				expect(JSON.stringify(payload))
					.not.toContain("password");
				expect(JSON.stringify(payload))
					.not.toContain("Connection string");
			});

		it("never includes stack traces in the payload",
			() =>
			{
				const error: Error =
					new Error("Sensitive stack info");

				const payload: SafeErrorPayload =
					toSafeLogPayload(error, "corr-456");

				expect(payload)
					.not.toHaveProperty("stackTrace");
				expect(payload)
					.not.toHaveProperty("stack");
				expect(JSON.stringify(payload))
					.not.toContain("stack");
			});

		it("classifies TypeError correctly",
			() =>
			{
				const error: TypeError =
					new TypeError("Cannot read property of undefined");

				const payload: SafeErrorPayload =
					toSafeLogPayload(error);

				expect(payload.code)
					.toBe("TYPE_ERROR");
			});

		it("classifies RangeError correctly",
			() =>
			{
				const error: RangeError =
					new RangeError("Maximum call stack size exceeded");

				const payload: SafeErrorPayload =
					toSafeLogPayload(error);

				expect(payload.code)
					.toBe("RANGE_ERROR");
			});

		it("classifies ReferenceError correctly",
			() =>
			{
				const error: ReferenceError =
					new ReferenceError("variable is not defined");

				const payload: SafeErrorPayload =
					toSafeLogPayload(error);

				expect(payload.code)
					.toBe("REFERENCE_ERROR");
			});

		it("classifies SyntaxError correctly",
			() =>
			{
				const error: SyntaxError =
					new SyntaxError("Unexpected token");

				const payload: SafeErrorPayload =
					toSafeLogPayload(error);

				expect(payload.code)
					.toBe("SYNTAX_ERROR");
			});

		it("handles non-Error values",
			() =>
			{
				const payload: SafeErrorPayload =
					toSafeLogPayload("string error", "corr-789");

				expect(payload.message)
					.toBe("An internal error occurred");
				expect(payload.code)
					.toBe("UNKNOWN_ERROR");
				expect(payload.correlationId)
					.toBe("corr-789");
			});

		it("handles null and undefined",
			() =>
			{
				const nullPayload: SafeErrorPayload =
					toSafeLogPayload(null);

				expect(nullPayload.code)
					.toBe("UNKNOWN_ERROR");
				expect(nullPayload.correlationId)
					.toBeTruthy();

				const undefinedPayload: SafeErrorPayload =
					toSafeLogPayload(undefined);

				expect(undefinedPayload.code)
					.toBe("UNKNOWN_ERROR");
			});

		it("generates correlation ID when not provided",
			() =>
			{
				vi.stubGlobal("crypto",
					{ randomUUID: (): string => "generated-uuid-1234" });

				const payload: SafeErrorPayload =
					toSafeLogPayload(new Error("test"));

				expect(payload.correlationId)
					.toBe("generated-uuid-1234");

				vi.unstubAllGlobals();
			});

		it("never exposes email addresses from error messages",
			() =>
			{
				const error: Error =
					new Error("Failed to send email to user@example.com");

				const payload: SafeErrorPayload =
					toSafeLogPayload(error);

				expect(JSON.stringify(payload))
					.not.toContain("user@example.com");
			});
	});

describe("maskPii",
	() =>
	{
		it("masks email addresses",
			() =>
			{
				const result: string =
					maskPii("Contact user@example.com for support");

				expect(result)
					.toBe("Contact us***@example.com for support");
				expect(result)
					.not.toContain("user@");
			});

		it("masks multiple email addresses",
			() =>
			{
				const result: string =
					maskPii("From admin@test.com to bob@domain.org");

				expect(result)
					.not.toContain("admin@");
				expect(result)
					.not.toContain("bob@");
			});

		it("preserves non-email text",
			() =>
			{
				const result: string =
					maskPii("Error code 500 at /api/orders");

				expect(result)
					.toBe("Error code 500 at /api/orders");
			});

		it("handles empty string",
			() =>
			{
				const result: string =
					maskPii("");

				expect(result)
					.toBe("");
			});
	});
