import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DateService, TokenService } from "@shared/services";
import { DOTNET_ROLE_CLAIM, JwtClaims } from "@shared/services/auth.types";

/**
 * Creates a valid test JWT token with specified claims.
 *
 * @param dateService
 * DateService instance for timestamp operations.
 *
 * @param claims
 * Partial claims to include in the token.
 *
 * @returns
 * A JWT token string.
 */
function createTestToken(
	dateService: DateService,
	claims: Partial<JwtClaims> & Record<string, unknown>): string
{
	const header: Record<string, string> =
		{ alg: "HS256", typ: "JWT" };
	const nowSeconds: number =
		Math.floor(dateService.nowTimestamp() / 1000);
	const defaultClaims: JwtClaims =
		{
			sub: "123",
			unique_name: "testuser",
			exp: nowSeconds + 3600,
			iat: nowSeconds,
			jti: "test-jti-12345"
		};

	const mergedClaims: JwtClaims & Record<string, unknown> =
		{ ...defaultClaims, ...claims };

	const headerBase64: string =
		btoa(JSON.stringify(header))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	const payloadBase64: string =
		btoa(JSON.stringify(mergedClaims))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	const signature: string = "mock-signature";

	return `${headerBase64}.${payloadBase64}.${signature}`;
}

describe("TokenService",
	() =>
	{
		let service: TokenService;
		let dateService: DateService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TokenService,
							DateService
						]
					});

				service =
					TestBed.inject(TokenService);
				dateService =
					TestBed.inject(DateService);
			});

		describe("parseJwt",
			() =>
			{
				it("should parse valid JWT token and return claims",
					() =>
					{
						const token: string =
							createTestToken(
								dateService,
								{
									sub: "456",
									unique_name: "john.doe"
								});

						const result: JwtClaims | null =
							service.parseJwt(token);

						expect(result).not.toBeNull();
						expect(result?.sub)
							.toBe("456");
						expect(result?.unique_name)
							.toBe("john.doe");
					});

				it("should return null for invalid token with wrong part count",
					() =>
					{
						const result: JwtClaims | null =
							service.parseJwt("invalid-token");

						expect(result)
							.toBeNull();
					});

				it("should return null for token with two parts",
					() =>
					{
						const result: JwtClaims | null =
							service.parseJwt("part1.part2");

						expect(result)
							.toBeNull();
					});

				it("should return null for empty string",
					() =>
					{
						const result: JwtClaims | null =
							service.parseJwt("");

						expect(result)
							.toBeNull();
					});

				it("should return null for malformed base64 payload",
					() =>
					{
						const result: JwtClaims | null =
							service.parseJwt("eyJhbGciOiJIUzI1NiJ9.!!!invalid!!!.signature");

						expect(result)
							.toBeNull();
					});

				it("should handle URL-safe base64 encoding",
					() =>
					{
						// Token with characters that need URL-safe encoding
						const token: string =
							createTestToken(
								dateService,
								{
									sub: "user/with+special=chars",
									unique_name: "test"
								});

						const result: JwtClaims | null =
							service.parseJwt(token);

						expect(result).not.toBeNull();
						expect(result?.sub)
							.toBe("user/with+special=chars");
					});
			});

		describe("isTokenExpired",
			() =>
			{
				it("should return true for expired token",
					() =>
					{
						const nowSeconds: number =
							Math.floor(dateService.nowTimestamp() / 1000);
						const expiredToken: string =
							createTestToken(
								dateService,
								{
									exp: nowSeconds - 3600 // Expired 1 hour ago
								});

						const result: boolean =
							service.isTokenExpired(expiredToken);

						expect(result)
							.toBe(true);
					});

				it("should return false for valid token",
					() =>
					{
						const nowSeconds: number =
							Math.floor(dateService.nowTimestamp() / 1000);
						const validToken: string =
							createTestToken(
								dateService,
								{
									exp: nowSeconds + 3600 // Expires in 1 hour
								});

						const result: boolean =
							service.isTokenExpired(validToken);

						expect(result)
							.toBe(false);
					});

				it("should return true when within buffer seconds of expiry",
					() =>
					{
						const nowSeconds: number =
							Math.floor(dateService.nowTimestamp() / 1000);
						// Token expires in 30 seconds, buffer is 60 seconds
						const soonExpireToken: string =
							createTestToken(
								dateService,
								{
									exp: nowSeconds + 30
								});

						const result: boolean =
							service.isTokenExpired(soonExpireToken, 60);

						expect(result)
							.toBe(true);
					});

				it("should return true for invalid token",
					() =>
					{
						const result: boolean =
							service.isTokenExpired("invalid-token");

						expect(result)
							.toBe(true);
					});

				it("should use default buffer of 60 seconds",
					() =>
					{
						const nowSeconds: number =
							Math.floor(dateService.nowTimestamp() / 1000);
						// Token expires in 59 seconds
						const soonExpireToken: string =
							createTestToken(
								dateService,
								{
									exp: nowSeconds + 59
								});

						const result: boolean =
							service.isTokenExpired(soonExpireToken);

						expect(result)
							.toBe(true);
					});
			});

		describe("getTokenExpiration",
			() =>
			{
				it("should return expiration date for valid token",
					() =>
					{
						const nowSeconds: number =
							Math.floor(dateService.nowTimestamp() / 1000);
						const expTime: number =
							nowSeconds + 3600;
						const token: string =
							createTestToken(
								dateService,
								{ exp: expTime });

						const result: ReturnType<typeof service.getTokenExpiration> =
							service.getTokenExpiration(token);

						expect(result).not.toBeNull();
						expect(result?.getTime())
							.toBe(expTime * 1000);
					});

				it("should return null for invalid token",
					() =>
					{
						const result: ReturnType<typeof service.getTokenExpiration> =
							service.getTokenExpiration("invalid");

						expect(result)
							.toBeNull();
					});
			});

		describe("extractRoles",
			() =>
			{
				it("should extract roles from array claim",
					() =>
					{
						const token: string =
							createTestToken(
								dateService,
								{
									[DOTNET_ROLE_CLAIM]: ["Admin", "Developer"]
								});

						const result: string[] =
							service.extractRoles(token);

						expect(result)
							.toEqual(
								["Admin", "Developer"]);
					});

				it("should extract single role from string claim",
					() =>
					{
						const token: string =
							createTestToken(
								dateService,
								{
									[DOTNET_ROLE_CLAIM]: "User"
								});

						const result: string[] =
							service.extractRoles(token);

						expect(result)
							.toEqual(
								["User"]);
					});

				it("should return empty array when no role claim",
					() =>
					{
						const token: string =
							createTestToken(
								dateService,
								{});

						const result: string[] =
							service.extractRoles(token);

						expect(result)
							.toEqual([]);
					});

				it("should return empty array for invalid token",
					() =>
					{
						const result: string[] =
							service.extractRoles("invalid");

						expect(result)
							.toEqual([]);
					});
			});
	});