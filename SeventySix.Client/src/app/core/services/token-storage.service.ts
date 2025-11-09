import { Injectable } from "@angular/core";

/**
 * Token storage service.
 * Handles secure storage and retrieval of authentication tokens.
 * Uses localStorage for persistence.
 */
@Injectable({
	providedIn: "root"
})
export class TokenStorageService
{
	private readonly ACCESS_TOKEN_KEY = "auth_access_token";
	private readonly REFRESH_TOKEN_KEY = "auth_refresh_token";

	/**
	 * Stores access token.
	 */
	setAccessToken(token: string): void
	{
		try
		{
			localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
		}
		catch (error)
		{
			console.error("Failed to store access token:", error);
		}
	}

	/**
	 * Retrieves access token.
	 */
	getAccessToken(): string | null
	{
		try
		{
			return localStorage.getItem(this.ACCESS_TOKEN_KEY);
		}
		catch (error)
		{
			console.error("Failed to retrieve access token:", error);
			return null;
		}
	}

	/**
	 * Stores refresh token.
	 */
	setRefreshToken(token: string): void
	{
		try
		{
			localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
		}
		catch (error)
		{
			console.error("Failed to store refresh token:", error);
		}
	}

	/**
	 * Retrieves refresh token.
	 */
	getRefreshToken(): string | null
	{
		try
		{
			return localStorage.getItem(this.REFRESH_TOKEN_KEY);
		}
		catch (error)
		{
			console.error("Failed to retrieve refresh token:", error);
			return null;
		}
	}

	/**
	 * Clears all tokens.
	 */
	clearTokens(): void
	{
		try
		{
			localStorage.removeItem(this.ACCESS_TOKEN_KEY);
			localStorage.removeItem(this.REFRESH_TOKEN_KEY);
		}
		catch (error)
		{
			console.error("Failed to clear tokens:", error);
		}
	}

	/**
	 * Checks if user is authenticated (has valid access token).
	 */
	isAuthenticated(): boolean
	{
		const token = this.getAccessToken();
		if (!token)
		{
			return false;
		}

		// TODO: Add token expiration check
		// const payload = this.parseJwt(token);
		// return payload.exp > Date.now() / 1000;

		return true;
	}

	/**
	 * Parses JWT token to extract payload.
	 */
	private parseJwt(
		token: string
	): { exp: number; [key: string]: unknown } | null
	{
		try
		{
			const base64Url = token.split(".")[1];
			const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
			const jsonPayload = decodeURIComponent(
				atob(base64)
					.split("")
					.map(
						(c) =>
							"%" +
							("00" + c.charCodeAt(0).toString(16)).slice(-2)
					)
					.join("")
			);
			return JSON.parse(jsonPayload);
		}
		catch (error)
		{
			console.error("Failed to parse JWT:", error);
			return null;
		}
	}
}
