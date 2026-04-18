import { describe, expect, it } from "vitest";
import { redactPayload, REDACTED_VALUE } from "../redact";

describe("redactPayload",
	() =>
	{
		it("should redact sensitive keys",
			() =>
			{
				const payload: Record<string, unknown> =
					{
						password: "super-secret",
						refreshToken: "tok-123",
						accessToken: "at-456",
						mfaCode: "123456",
						backupCode: "abcd-1234",
						totpSecret: "base32secret",
						secretKey: "sign-key",
						apiKey: "key-789",
						api_key: "key-alt",
						connectionString: "Host=db;Password=x",
						token: "jwt-xyz",
					};

				const result: Record<string, unknown> =
					redactPayload(payload);

				for (const key of Object.keys(payload))
				{
					expect(result[key])
						.toBe(REDACTED_VALUE);
				}
			});

		it("should pass through non-sensitive keys unchanged",
			() =>
			{
				const payload: Record<string, unknown> =
					{
						username: "johndoe",
						email: "user@example.com",
						requestPath: "/api/test",
						statusCode: 200,
						duration: 42,
					};

				const result: Record<string, unknown> =
					redactPayload(payload);

				expect(result)
					.toEqual(payload);
			});

		it("should handle case-insensitive key matching",
			() =>
			{
				const payload: Record<string, unknown> =
					{
						Password: "secret",
						ACCESS_TOKEN: "tok",
						RefreshToken: "ref-tok",
					};

				const result: Record<string, unknown> =
					redactPayload(payload);

				expect(result["Password"])
					.toBe(REDACTED_VALUE);
				expect(result["ACCESS_TOKEN"])
					.toBe(REDACTED_VALUE);
				expect(result["RefreshToken"])
					.toBe(REDACTED_VALUE);
			});

		it("should return a new object without mutating the original",
			() =>
			{
				const payload: Record<string, unknown> =
					{
						password: "secret",
						username: "test",
					};

				const result: Record<string, unknown> =
					redactPayload(payload);

				expect(result).not.toBe(payload);
				expect(payload["password"])
					.toBe("secret");
			});
	});