import { inject, Injectable } from "@angular/core";
import { DOTNET_ROLE_CLAIM, JwtClaims } from "@shared/services/auth.types";
import { DateService } from "@shared/services/date.service";
import { isNullOrEmpty, isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Default buffer time in seconds before token expiration.
 */
const DEFAULT_EXPIRY_BUFFER_SECONDS: number = 60;

/**
 * Service for parsing and validating JWT tokens.
 * Provides utilities for token expiration checking and claim extraction.
 */
@Injectable(
	{ providedIn: "root" })
export class TokenService
{
	/**
	 * DateService for timestamp operations.
	 */
	private readonly dateService: DateService =
		inject(DateService);
	/**
	 * Parses a JWT token and extracts its claims.
	 *
	 * @param token
	 * The JWT token string to parse.
	 *
	 * @returns
	 * The parsed JWT claims or null if the token is invalid.
	 */
	parseJwt(token: string): JwtClaims | null
	{
		if (isNullOrEmpty(token))
		{
			return null;
		}

		const parts: string[] =
			token.split(".");

		if (parts.length !== 3)
		{
			return null;
		}

		try
		{
			const payload: string =
				parts[1];
			// Handle URL-safe base64 encoding
			const base64: string =
				payload
					.replace(/-/g, "+")
					.replace(/_/g, "/");
			const jsonPayload: string =
				decodeURIComponent(
					atob(base64)
						.split("")
						.map(
							(character: string): string =>
								"%" + ("00" + character
									.charCodeAt(0)
									.toString(16))
									.slice(-2))
						.join(""));

			return JSON.parse(jsonPayload) as JwtClaims;
		}
		catch
		{
			return null;
		}
	}

	/**
	 * Checks if a JWT token is expired or will expire within the buffer time.
	 *
	 * @param token
	 * The JWT token string to check.
	 *
	 * @param bufferSeconds
	 * The number of seconds before actual expiration to consider the token expired.
	 * Defaults to 60 seconds.
	 *
	 * @returns
	 * True if the token is expired or will expire within the buffer time.
	 */
	isTokenExpired(
		token: string,
		bufferSeconds: number = DEFAULT_EXPIRY_BUFFER_SECONDS): boolean
	{
		const claims: JwtClaims | null =
			this.parseJwt(token);

		if (isNullOrUndefined(claims?.exp))
		{
			return true;
		}

		const expirationTime: number =
			claims.exp * 1000;
		const currentTime: number =
			this.dateService.nowTimestamp();
		const bufferMillis: number =
			bufferSeconds * 1000;

		return currentTime >= expirationTime - bufferMillis;
	}

	/**
	 * Gets the expiration date of a JWT token.
	 *
	 * @param token
	 * The JWT token string.
	 *
	 * @returns
	 * The expiration date or null if the token is invalid or has no expiration.
	 */
	getTokenExpiration(token: string): Date | null
	{
		const claims: JwtClaims | null =
			this.parseJwt(token);

		if (isNullOrUndefined(claims?.exp))
		{
			return null;
		}

		return this.dateService.fromMillis(claims.exp * 1000);
	}

	/**
	 * Extracts role claims from a JWT token.
	 *
	 * @param token
	 * The JWT token string.
	 *
	 * @returns
	 * An array of role names. Returns empty array if no roles or invalid token.
	 */
	extractRoles(token: string): string[]
	{
		const claims: JwtClaims | null =
			this.parseJwt(token);

		if (isNullOrUndefined(claims))
		{
			return [];
		}

		const roleClaim: string | number | string[] | undefined =
			claims[DOTNET_ROLE_CLAIM];

		if (isNullOrUndefined(roleClaim))
		{
			return [];
		}

		if (Array.isArray(roleClaim))
		{
			return roleClaim;
		}

		if (typeof roleClaim === "number")
		{
			return [];
		}

		return [roleClaim];
	}
}
