# Security Enhancement Implementation Plan

## reCAPTCHA v3 with Rate Limiting + OWASP Best Practices

**Created:** January 18, 2026
**Status:** Ready for Implementation
**Principles:** KISS, DRY, YAGNI, TDD (80/20 Rule)

---

## Executive Summary

This plan implements Google reCAPTCHA v3 with rate limiting to protect authentication endpoints from automated attacks and crawlers. The implementation follows OWASP principles, leverages the existing rate limiting infrastructure, and integrates with the `ThirdPartyApiRequests` tracking system for unified API monitoring.

### Key Decisions

| Decision            | Choice                                | Rationale                                                                                   |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| reCAPTCHA Version   | **v3 (Invisible/Score-based)**        | Zero user friction, best UX, score-based risk assessment                                    |
| Tier                | **reCAPTCHA Essentials (Free)**       | 10,000 assessments/month per organization - sufficient for most use cases                   |
| .NET Library        | **No external library**               | Direct HTTP call via existing `HttpClient` - YAGNI principle                                |
| Angular Library     | **Custom service (NOT ng-recaptcha)** | ng-recaptcha last updated Nov 2023, only supports Angular 17 - incompatible with Angular 21 |
| Secrets Storage     | **Environment variables via `.env`**  | Consistent with existing Brevo, JWT, GitHub OAuth patterns                                  |
| API Tracking        | **ThirdPartyApiRequests**             | Consistent with Brevo tracking, unified dashboard, existing infrastructure                  |
| Rate Limit Interval | **Monthly (10,000/month)**            | Matches Google's free tier exactly, allows heavier days without artificial daily caps       |
| Protected Endpoints | Login, Register, Password Reset       | High-value targets for credential stuffing/account creation fraud                           |

### ng-recaptcha Library Evaluation

| Criteria         | Status                 | Notes                        |
| ---------------- | ---------------------- | ---------------------------- |
| Last Release     | Nov 24, 2023 (v13.2.1) | **2+ years stale**           |
| Angular Support  | Up to Angular 17       | **No Angular 18-21 support** |
| Weekly Downloads | ~127K                  | Popular but declining        |
| Open Issues      | 17                     | Some unresolved              |
| Maintenance      | Inactive               | No commits in 2+ years       |

**Decision: Roll custom service.** The library is unmaintained and incompatible with Angular 21. A custom service is ~50 lines of code and gives us full control, proper typing, and tree-shaking benefits.

### Free Tier Confirmation

Per Google Cloud Pricing (verified January 2026):

- **reCAPTCHA Essentials**: Free up to **10,000 assessments/month** per organization
- Limit aggregates across all accounts and all sites
- No credit card required for Essentials tier

---

## Security Best Practices Implementation

### Secrets Management Strategy

**CRITICAL:** All secrets follow the existing `.env` pattern used by Brevo, JWT, and GitHub OAuth.

| Secret               | Storage                         | Never In                                  |
| -------------------- | ------------------------------- | ----------------------------------------- |
| reCAPTCHA Site Key   | `.env` → `RECAPTCHA_SITE_KEY`   | Git, appsettings.json values              |
| reCAPTCHA Secret Key | `.env` → `RECAPTCHA_SECRET_KEY` | Git, appsettings.json values, client code |

**Pattern Confirmation:** Per `.env.example`:

- `JWT_SECRET_KEY` → `Jwt:SecretKey`
- `GITHUB_CLIENT_SECRET` → `Auth:OAuth:Providers:0:ClientSecret`
- `EMAIL_SMTP_PASSWORD` → `Email:SmtpPassword`
- **NEW:** `RECAPTCHA_SECRET_KEY` → `Recaptcha:SecretKey`

### OWASP Alignment

| OWASP Risk                         | How This Implementation Addresses It                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| A01:2021 Broken Access Control     | reCAPTCHA on auth endpoints prevents unauthorized automated access   |
| A04:2021 Insecure Design           | Monthly rate limits prevent quota abuse; score thresholds block bots |
| A05:2021 Security Misconfiguration | Secrets in `.env`, never committed; disabled by default in dev/test  |
| A07:2021 Auth Failures             | Mitigates credential stuffing, brute force via invisible challenge   |

---

## Architecture: Bounded Context Considerations

### Domain Placement

reCAPTCHA validation involves two bounded contexts:

| Context         | Responsibility                                            | Files                                                               |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| **ApiTracking** | Track API call counts, limits (daily/monthly), monitoring | `ExternalApiConstants`, `ThirdPartyApiRequest`, rate limit settings |
| **Identity**    | Consume validation result, protect auth endpoints         | `RecaptchaService`, command handlers                                |

**Design Decision:** Following DIP and bounded context principles:

1. **API name constant** → `ApiTracking` domain (alongside `BrevoEmail`)
2. **Rate limit settings** → `ApiTracking` domain (extends `ThirdPartyApiLimitSettings` pattern)
3. **Validation service** → `Identity` domain (consumes ApiTracking abstractions)
4. **HTTP client** → Standard `HttpClient` with DI

This mirrors how Brevo is structured: the email service lives in `ElectronicNotifications` but its API tracking lives in `ApiTracking`.

---

## Phase 1: Extend ThirdPartyApiLimitSettings for Configurable Intervals

### 1.1 Update ThirdPartyApiLimit Record

**File:** `SeventySix.Server/SeventySix.Domains/ApiTracking/Settings/ThirdPartyApiLimitSettings.cs`

**Current:** Only supports `DailyLimit`
**New:** Supports both `DailyLimit` and `MonthlyLimit` with `LimitInterval` enum

```csharp
// <copyright file="ThirdPartyApiLimitSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Defines the interval for rate limit tracking.
/// </summary>
public enum LimitInterval
{
	/// <summary>
	/// Limit resets daily at midnight UTC.
	/// </summary>
	Daily,

	/// <summary>
	/// Limit resets monthly on the 1st at midnight UTC.
	/// </summary>
	Monthly
}

/// <summary>
/// Configuration for third-party API rate limits.
/// Bound from appsettings.json "ThirdPartyApiLimits" section.
/// </summary>
public record ThirdPartyApiLimitSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "ThirdPartyApiLimits";

	/// <summary>
	/// Gets the default daily limit when API-specific limit not configured.
	/// </summary>
	public int DefaultDailyLimit { get; init; } = 1000;

	/// <summary>
	/// Gets the default monthly limit when API-specific limit not configured.
	/// </summary>
	public int DefaultMonthlyLimit { get; init; } = 30000;

	/// <summary>
	/// Gets a value indicating whether rate limiting is enabled globally.
	/// When false, rate limiting checks are bypassed (development mode).
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets the per-API limit configurations.
	/// Key: API name (must match ExternalApiConstants values).
	/// </summary>
	public Dictionary<string, ThirdPartyApiLimit> Limits { get; init; } = [];

	/// <summary>
	/// Gets the configured limit for a specific API based on its interval.
	/// Returns appropriate default if API not explicitly configured.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// The limit value for the API.
	/// </returns>
	public int GetLimit(string apiName)
	{
		ThirdPartyApiLimit? apiLimit =
			Limits.GetValueOrDefault(apiName);

		if (apiLimit is null)
		{
			return DefaultDailyLimit;
		}

		return apiLimit.Interval switch
		{
			LimitInterval.Monthly => apiLimit.MonthlyLimit ?? DefaultMonthlyLimit,
			_ => apiLimit.DailyLimit ?? DefaultDailyLimit
		};
	}

	/// <summary>
	/// Gets the limit interval for a specific API.
	/// Returns Daily if API not explicitly configured.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// The limit interval for the API.
	/// </returns>
	public LimitInterval GetLimitInterval(string apiName)
	{
		ThirdPartyApiLimit? apiLimit =
			Limits.GetValueOrDefault(apiName);

		return apiLimit?.Interval ?? LimitInterval.Daily;
	}

	/// <summary>
	/// Checks if rate limiting is enabled for a specific API.
	/// Returns false if master Enabled is false OR API-specific Enabled is false.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// True if rate limiting should be enforced for this API.
	/// </returns>
	public bool IsApiRateLimitEnabled(string apiName)
	{
		if (!Enabled)
		{
			return false;
		}

		ThirdPartyApiLimit? apiLimit =
			Limits.GetValueOrDefault(apiName);

		return apiLimit?.Enabled ?? true;
	}

	/// <summary>
	/// Gets the configured daily limit for a specific API.
	/// Preserved for backward compatibility with existing Brevo integration.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// The daily limit for the API.
	/// </returns>
	[Obsolete("Use GetLimit() which handles both daily and monthly intervals.")]
	public int GetDailyLimit(string apiName)
	{
		ThirdPartyApiLimit? apiLimit =
			Limits.GetValueOrDefault(apiName);

		return apiLimit?.DailyLimit ?? DefaultDailyLimit;
	}
}

/// <summary>
/// Configuration for a specific third-party API limit.
/// Supports both daily and monthly intervals.
/// </summary>
public record ThirdPartyApiLimit
{
	/// <summary>
	/// Gets the interval type for this limit (Daily or Monthly).
	/// Default is Daily for backward compatibility.
	/// </summary>
	public LimitInterval Interval { get; init; } = LimitInterval.Daily;

	/// <summary>
	/// Gets the daily request limit for this API.
	/// Used when Interval is Daily.
	/// </summary>
	public int? DailyLimit { get; init; }

	/// <summary>
	/// Gets the monthly request limit for this API.
	/// Used when Interval is Monthly. Resets on 1st of month at midnight UTC.
	/// </summary>
	public int? MonthlyLimit { get; init; }

	/// <summary>
	/// Gets a value indicating whether rate limiting is enabled for this API.
	/// Useful for temporarily disabling limits during testing.
	/// </summary>
	public bool Enabled { get; init; } = true;
}
```

### 1.2 Update IRateLimitingService Interface

**File:** `SeventySix.Server/SeventySix.Domains/ApiTracking/Interfaces/IRateLimitingService.cs`

Add method to support interval-aware checking:

```csharp
/// <summary>
/// Checks if a request can be made within the configured interval (daily/monthly).
/// </summary>
/// <param name="apiName">
/// The API name from ExternalApiConstants.
/// </param>
/// <param name="interval">
/// The limit interval to check against.
/// </param>
/// <param name="cancellationToken">
/// Cancellation token.
/// </param>
/// <returns>
/// True if request count is within limit for the interval.
/// </returns>
Task<bool> CanMakeRequestAsync(
	string apiName,
	LimitInterval interval,
	CancellationToken cancellationToken = default);

/// <summary>
/// Gets the current request count for an API within the specified interval.
/// </summary>
/// <param name="apiName">
/// The API name from ExternalApiConstants.
/// </param>
/// <param name="interval">
/// The limit interval (Daily resets at midnight UTC, Monthly resets on 1st).
/// </param>
/// <param name="cancellationToken">
/// Cancellation token.
/// </param>
/// <returns>
/// Current request count for the interval.
/// </returns>
Task<int> GetCurrentCountAsync(
	string apiName,
	LimitInterval interval,
	CancellationToken cancellationToken = default);
```

### 1.3 Update RateLimitingService Implementation

**File:** `SeventySix.Server/SeventySix.Domains/ApiTracking/Services/RateLimitingService.cs`

Add interval-aware date range calculation:

```csharp
/// <summary>
/// Gets the date range for the specified interval.
/// </summary>
/// <param name="interval">
/// The limit interval.
/// </param>
/// <returns>
/// Tuple of (startDate, endDate) for the interval.
/// </returns>
private static (DateTimeOffset StartDate, DateTimeOffset EndDate) GetIntervalDateRange(
	LimitInterval interval)
{
	DateTimeOffset utcNow =
		DateTimeOffset.UtcNow;

	return interval switch
	{
		LimitInterval.Monthly => (
			new DateTimeOffset(
				utcNow.Year,
				utcNow.Month,
				1,
				0,
				0,
				0,
				TimeSpan.Zero),
			utcNow),
		_ => (
			utcNow.Date,
			utcNow)
	};
}
```

---

## Phase 2: Backend Infrastructure (Server-Side)

### 2.1 Add reCAPTCHA to External API Constants

**File:** `SeventySix.Server/SeventySix.Domains/ApiTracking/Constants/ExternalApiConstants.cs`

```csharp
// <copyright file="ExternalApiConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Constants for external API names tracked by the system.
/// </summary>
public static class ExternalApiConstants
{
	/// <summary>
	/// Brevo (formerly Sendinblue) email service.
	/// </summary>
	public const string BrevoEmail = "BrevoEmail";

	/// <summary>
	/// Google reCAPTCHA v3 verification service.
	/// </summary>
	public const string GoogleRecaptcha = "GoogleRecaptcha";
}
```

### 2.2 Update ThirdPartyApiLimits Configuration

**File:** `SeventySix.Server/SeventySix.Api/appsettings.json` (add to existing `ThirdPartyApiLimits` section)

```json
{
	"ThirdPartyApiLimits": {
		"DefaultDailyLimit": 1000,
		"DefaultMonthlyLimit": 30000,
		"Enabled": true,
		"Limits": {
			"BrevoEmail": {
				"Interval": "Daily",
				"DailyLimit": 250,
				"Enabled": true
			},
			"GoogleRecaptcha": {
				"Interval": "Monthly",
				"MonthlyLimit": 10000,
				"Enabled": true
			}
		}
	}
}
```

**Key Change:** reCAPTCHA uses `MonthlyLimit: 10000` (not daily approximation) - allows traffic spikes on busy days without artificial daily caps.

### 2.3 reCAPTCHA Settings (Identity Domain)

**File:** `SeventySix.Server/SeventySix.Domains/Identity/Settings/RecaptchaSettings.cs`

```csharp
// <copyright file="RecaptchaSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// reCAPTCHA v3 configuration settings.
/// Bound from appsettings.json "Recaptcha" section.
/// </summary>
/// <remarks>
/// <para>
/// Site key is public (sent to client via API endpoint).
/// Secret key is private (server-side only).
/// </para>
/// <para>
/// Both keys must be stored in .env file and mapped via environment variables.
/// NEVER commit actual key values to appsettings.json or source control.
/// </para>
/// </remarks>
public record RecaptchaSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "Recaptcha";

	/// <summary>
	/// Gets a value indicating whether reCAPTCHA validation is enabled.
	/// When false, validation is skipped (useful for development/testing).
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets the reCAPTCHA site key (public, sent to client via secure endpoint).
	/// Stored in .env as RECAPTCHA_SITE_KEY.
	/// </summary>
	public string SiteKey { get; init; } = string.Empty;

	/// <summary>
	/// Gets the reCAPTCHA secret key (private, server-only).
	/// Stored in .env as RECAPTCHA_SECRET_KEY.
	/// NEVER expose this value to clients or logs.
	/// </summary>
	public string SecretKey { get; init; } = string.Empty;

	/// <summary>
	/// Gets the minimum score threshold (0.0 to 1.0).
	/// Requests with scores below this are rejected.
	/// Default: 0.5 (Google's recommended threshold).
	/// </summary>
	public double MinimumScore { get; init; } = 0.5;

	/// <summary>
	/// Gets the Google reCAPTCHA verification endpoint.
	/// </summary>
	public string VerifyUrl { get; init; } =
		"https://www.google.com/recaptcha/api/siteverify";
}
```

### 2.4 appsettings.json Configuration

**Add to existing appsettings.json:**

```json
{
	"Recaptcha": {
		"Enabled": true,
		"SiteKey": "PLACEHOLDER_USE_ENV_VAR",
		"SecretKey": "PLACEHOLDER_USE_ENV_VAR",
		"MinimumScore": 0.5,
		"VerifyUrl": "https://www.google.com/recaptcha/api/siteverify"
	}
}
```

**appsettings.Development.json:**

```json
{
	"Recaptcha": {
		"Enabled": false
	}
}
```

**appsettings.Test.json:**

```json
{
	"Recaptcha": {
		"Enabled": false
	}
}
```

### 2.5 Update .env.example

**File:** `.env.example` (add reCAPTCHA section)

```dotenv
# ===========================
# Google reCAPTCHA v3
# ===========================
# Get credentials from https://www.google.com/recaptcha/admin/create
# Select reCAPTCHA v3 and add your domains (localhost for dev)
#
# Mapping: RECAPTCHA_* -> Recaptcha:*
RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key-here
```

### 2.6 Update docker-compose.production.yml

**File:** `docker-compose.production.yml` (add environment variable mappings)

```yaml
environment:
    # ... existing mappings
    - Recaptcha__SiteKey=${RECAPTCHA_SITE_KEY:?RECAPTCHA_SITE_KEY must be set in .env}
    - Recaptcha__SecretKey=${RECAPTCHA_SECRET_KEY:?RECAPTCHA_SECRET_KEY must be set in .env}
```

### 2.7 reCAPTCHA Service Interface

**File:** `SeventySix.Server/SeventySix.Domains/Identity/Interfaces/IRecaptchaService.cs`

```csharp
// <copyright file="IRecaptchaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for validating reCAPTCHA v3 tokens.
/// </summary>
public interface IRecaptchaService
{
	/// <summary>
	/// Validates a reCAPTCHA token against Google's verification API.
	/// </summary>
	/// <param name="token">
	/// The reCAPTCHA token from the client.
	/// </param>
	/// <param name="expectedAction">
	/// The expected action name (e.g., "login", "register").
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A result indicating success/failure with score and any errors.
	/// </returns>
	Task<RecaptchaValidationResult> ValidateAsync(
		string token,
		string expectedAction,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a value indicating whether reCAPTCHA validation is enabled.
	/// </summary>
	bool IsEnabled { get; }
}
```

### 2.8 Validation Result POCO

**File:** `SeventySix.Server/SeventySix.Domains/Identity/POCOs/Results/RecaptchaValidationResult.cs`

```csharp
// <copyright file="RecaptchaValidationResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of reCAPTCHA token validation.
/// </summary>
public record RecaptchaValidationResult
{
	/// <summary>
	/// Gets a value indicating whether validation succeeded.
	/// </summary>
	public bool Success { get; init; }

	/// <summary>
	/// Gets the risk score (0.0 = likely bot, 1.0 = likely human).
	/// </summary>
	public double Score { get; init; }

	/// <summary>
	/// Gets the action name returned by reCAPTCHA.
	/// </summary>
	public string Action { get; init; } = string.Empty;

	/// <summary>
	/// Gets any error codes from Google's response.
	/// </summary>
	public IReadOnlyList<string> ErrorCodes { get; init; } = [];

	/// <summary>
	/// Gets a value indicating whether reCAPTCHA was bypassed (disabled in settings).
	/// </summary>
	public bool WasBypassed { get; init; }

	/// <summary>
	/// Creates a successful validation result.
	/// </summary>
	/// <param name="score">
	/// The validation score.
	/// </param>
	/// <param name="action">
	/// The action name.
	/// </param>
	/// <returns>
	/// A successful result.
	/// </returns>
	public static RecaptchaValidationResult Succeeded(
		double score,
		string action) =>
		new()
		{
			Success = true,
			Score = score,
			Action = action
		};

	/// <summary>
	/// Creates a bypassed result (when reCAPTCHA is disabled).
	/// </summary>
	/// <returns>
	/// A bypassed result.
	/// </returns>
	public static RecaptchaValidationResult Bypassed() =>
		new()
		{
			Success = true,
			WasBypassed = true
		};

	/// <summary>
	/// Creates a failed validation result.
	/// </summary>
	/// <param name="errorCodes">
	/// The error codes from Google.
	/// </param>
	/// <returns>
	/// A failed result.
	/// </returns>
	public static RecaptchaValidationResult Failed(
		IReadOnlyList<string>? errorCodes = null) =>
		new()
		{
			Success = false,
			ErrorCodes = errorCodes ?? []
		};
}
```

### 2.9 Google Response POCO (Internal)

**File:** `SeventySix.Server/SeventySix.Domains/Identity/POCOs/Responses/RecaptchaVerifyResponse.cs`

```csharp
// <copyright file="RecaptchaVerifyResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Identity;

/// <summary>
/// Google reCAPTCHA v3 verification API response.
/// </summary>
/// <remarks>
/// Internal DTO for deserializing Google's response.
/// See: https://developers.google.com/recaptcha/docs/v3#site_verify_response
/// </remarks>
internal record RecaptchaVerifyResponse
{
	/// <summary>
	/// Gets a value indicating whether the token is valid.
	/// </summary>
	[JsonPropertyName("success")]
	public bool Success { get; init; }

	/// <summary>
	/// Gets the score for this request (0.0 - 1.0).
	/// </summary>
	[JsonPropertyName("score")]
	public double Score { get; init; }

	/// <summary>
	/// Gets the action name for this request.
	/// </summary>
	[JsonPropertyName("action")]
	public string Action { get; init; } = string.Empty;

	/// <summary>
	/// Gets the timestamp of the challenge load.
	/// </summary>
	[JsonPropertyName("challenge_ts")]
	public string? ChallengeTimestamp { get; init; }

	/// <summary>
	/// Gets the hostname of the site where reCAPTCHA was solved.
	/// </summary>
	[JsonPropertyName("hostname")]
	public string? Hostname { get; init; }

	/// <summary>
	/// Gets the error codes if validation failed.
	/// </summary>
	[JsonPropertyName("error-codes")]
	public List<string>? ErrorCodes { get; init; }
}
```

### 2.10 reCAPTCHA Service Implementation

**File:** `SeventySix.Server/SeventySix.Domains/Identity/Services/RecaptchaService.cs`

```csharp
// <copyright file="RecaptchaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ApiTracking;

namespace SeventySix.Identity;

/// <summary>
/// Service for validating reCAPTCHA v3 tokens against Google's API.
/// </summary>
/// <remarks>
/// Integrates with ThirdPartyApiRequests for rate limiting with monthly intervals.
/// </remarks>
public class RecaptchaService(
	HttpClient httpClient,
	IRateLimitingService rateLimitingService,
	IOptions<RecaptchaSettings> recaptchaSettings,
	IOptions<ThirdPartyApiLimitSettings> limitSettings,
	ILogger<RecaptchaService> logger) : IRecaptchaService
{
	private readonly RecaptchaSettings RecaptchaSettings = recaptchaSettings.Value;
	private readonly ThirdPartyApiLimitSettings LimitSettings = limitSettings.Value;

	/// <inheritdoc/>
	public bool IsEnabled => RecaptchaSettings.Enabled;

	/// <inheritdoc/>
	public async Task<RecaptchaValidationResult> ValidateAsync(
		string token,
		string expectedAction,
		CancellationToken cancellationToken = default)
	{
		// Check if reCAPTCHA is disabled
		if (!RecaptchaSettings.Enabled)
		{
			logger.LogInformation(
				"reCAPTCHA validation bypassed (disabled in settings)");
			return RecaptchaValidationResult.Bypassed();
		}

		// Validate input
		if (string.IsNullOrWhiteSpace(token))
		{
			logger.LogWarning("reCAPTCHA token is missing or empty");
			return RecaptchaValidationResult.Failed(["missing-input-response"]);
		}

		// Get interval from settings (Monthly for reCAPTCHA)
		LimitInterval interval =
			LimitSettings.GetLimitInterval(ExternalApiConstants.GoogleRecaptcha);

		// Check rate limit before making external call
		bool canMakeRequest =
			await rateLimitingService.CanMakeRequestAsync(
				ExternalApiConstants.GoogleRecaptcha,
				interval,
				cancellationToken);

		if (!canMakeRequest)
		{
			logger.LogWarning(
				"reCAPTCHA rate limit exceeded for {Interval} quota",
				interval);
			return RecaptchaValidationResult.Failed(["rate-limit-exceeded"]);
		}

		try
		{
			// Build form content for Google API
			FormUrlEncodedContent formContent =
				new(
				[
					new KeyValuePair<string, string>(
						"secret",
						RecaptchaSettings.SecretKey),
					new KeyValuePair<string, string>(
						"response",
						token)
				]);

			// Call Google verification API
			HttpResponseMessage httpResponse =
				await httpClient.PostAsync(
					RecaptchaSettings.VerifyUrl,
					formContent,
					cancellationToken);

			httpResponse.EnsureSuccessStatusCode();

			// Track the API call
			await rateLimitingService.TryIncrementRequestCountAsync(
				ExternalApiConstants.GoogleRecaptcha,
				RecaptchaSettings.VerifyUrl,
				cancellationToken);

			// Deserialize response
			RecaptchaVerifyResponse? verifyResponse =
				await httpResponse.Content.ReadFromJsonAsync<RecaptchaVerifyResponse>(
					cancellationToken);

			if (verifyResponse is null)
			{
				logger.LogError("Failed to deserialize reCAPTCHA response");
				return RecaptchaValidationResult.Failed(["invalid-response"]);
			}

			// Validate response
			return ValidateResponse(
				verifyResponse,
				expectedAction);
		}
		catch (HttpRequestException httpException)
		{
			logger.LogError(
				httpException,
				"reCAPTCHA verification failed: Network error");
			return RecaptchaValidationResult.Failed(["network-error"]);
		}
		catch (TaskCanceledException)
		{
			logger.LogWarning("reCAPTCHA verification timed out");
			return RecaptchaValidationResult.Failed(["timeout"]);
		}
	}

	private RecaptchaValidationResult ValidateResponse(
		RecaptchaVerifyResponse response,
		string expectedAction)
	{
		// Check if Google says it's valid
		if (!response.Success)
		{
			logger.LogWarning(
				"reCAPTCHA validation failed: {ErrorCodes}",
				string.Join(", ", response.ErrorCodes ?? []));
			return RecaptchaValidationResult.Failed(
				response.ErrorCodes?.AsReadOnly() ?? []);
		}

		// Check action matches
		if (!string.Equals(
			response.Action,
			expectedAction,
			StringComparison.OrdinalIgnoreCase))
		{
			logger.LogWarning(
				"reCAPTCHA action mismatch: Expected={Expected}, Actual={Actual}",
				expectedAction,
				response.Action);
			return RecaptchaValidationResult.Failed(["action-mismatch"]);
		}

		// Check score threshold
		if (response.Score < RecaptchaSettings.MinimumScore)
		{
			logger.LogWarning(
				"reCAPTCHA score below threshold: Score={Score}, Threshold={Threshold}, Action={Action}",
				response.Score,
				RecaptchaSettings.MinimumScore,
				response.Action);
			return RecaptchaValidationResult.Failed(["score-below-threshold"]);
		}

		logger.LogInformation(
			"reCAPTCHA validated: Action={Action}, Score={Score}",
			response.Action,
			response.Score);

		return RecaptchaValidationResult.Succeeded(
			response.Score,
			response.Action);
	}
}
```

### 2.11 Action Constants

**File:** `SeventySix.Server/SeventySix.Domains/Identity/Constants/RecaptchaActionConstants.cs`

```csharp
// <copyright file="RecaptchaActionConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// reCAPTCHA action name constants.
/// Actions must match between client and server validation.
/// </summary>
/// <remarks>
/// Action names follow reCAPTCHA guidelines:
/// - Only alphanumeric characters, slashes, and underscores
/// - Must not be user-specific
/// </remarks>
public static class RecaptchaActionConstants
{
	/// <summary>
	/// Login action.
	/// </summary>
	public const string Login = "login";

	/// <summary>
	/// Registration action.
	/// </summary>
	public const string Register = "register";

	/// <summary>
	/// Password reset action.
	/// </summary>
	public const string PasswordReset = "password_reset";
}
```

### 2.12 Request DTOs with reCAPTCHA Token

**Modify existing `LoginRequest.cs`** - Add property:

```csharp
/// <summary>
/// Gets the reCAPTCHA v3 token for bot protection.
/// Required when reCAPTCHA is enabled in configuration.
/// </summary>
public string? RecaptchaToken { get; init; }
```

**Modify existing `RegisterRequest.cs`** - Add same property.

---

## Phase 3: Command Handler Integration

### 3.1 Modify Login Command Handler

**File:** `SeventySix.Server/SeventySix.Domains/Identity/Commands/LoginUserCommandHandler.cs`

Integration points:

1. Inject `IRecaptchaService` via constructor
2. Validate reCAPTCHA token before processing login
3. Return appropriate error on validation failure
4. Log suspicious activity (low scores)

**Validation Flow:**

```
1. Check if reCAPTCHA is enabled via service.IsEnabled
2. If enabled and token missing → return validation error
3. If enabled → validate token with Google
4. If score < threshold → reject with generic "Login failed" (don't reveal reason)
5. If valid → proceed with existing login logic
```

### 3.2 Modify Register Command Handler

**File:** `SeventySix.Server/SeventySix.Domains/Identity/Commands/RegisterUserCommandHandler.cs`

Same pattern as login handler.

---

## Phase 4: Angular Client Integration

### 4.1 Environment Configuration

**File:** `SeventySix.Client/src/environments/environment.ts`

```typescript
export const environment = {
	// ... existing config
	recaptcha: {
		siteKey: "YOUR_SITE_KEY_HERE",
		enabled: true,
	},
};
```

**File:** `SeventySix.Client/src/environments/environment.development.ts`

```typescript
export const environment = {
	// ... existing config
	recaptcha: {
		siteKey: "",
		enabled: false,
	},
};
```

### 4.2 reCAPTCHA Service (Custom - NOT ng-recaptcha)

**File:** `SeventySix.Client/src/app/shared/services/recaptcha.service.ts`

```typescript
/**
 * Service for executing reCAPTCHA v3 challenges.
 * Custom implementation for Angular 21 compatibility.
 *
 * Why NOT ng-recaptcha?
 * - Last updated Nov 2023 (2+ years stale)
 * - Only supports up to Angular 17 (incompatible with Angular 21)
 * - No maintenance activity
 * - Custom service is ~50 lines with full control
 */

import { DOCUMENT } from "@angular/common";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";

/**
 * Google reCAPTCHA v3 global interface.
 */
declare const grecaptcha: {
	ready: (callback: () => void) => void;
	execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

/**
 * Provides reCAPTCHA v3 token generation for authentication forms.
 * Loads Google's reCAPTCHA script on-demand and executes invisible challenges.
 */
@Injectable({
	providedIn: "root",
})
export class RecaptchaService {
	/**
	 * Document reference for script injection.
	 */
	private readonly document: Document = inject(DOCUMENT);

	/**
	 * reCAPTCHA site key from environment configuration.
	 */
	private readonly siteKey: string = environment.recaptcha.siteKey;

	/**
	 * Whether reCAPTCHA is enabled in current environment.
	 */
	private readonly isEnabled: boolean = environment.recaptcha.enabled;

	/**
	 * Tracks whether the Google reCAPTCHA script has been loaded.
	 */
	private scriptLoaded: boolean = false;

	/**
	 * Executes reCAPTCHA v3 challenge for the given action.
	 * @param action - The action name (e.g., "login", "register").
	 * @returns Promise resolving to the reCAPTCHA token, or null if disabled.
	 */
	async executeAsync(action: string): Promise<string | null> {
		if (!this.isEnabled) {
			return null;
		}

		await this.ensureScriptLoadedAsync();

		return new Promise((resolve, reject) => {
			grecaptcha.ready(() => {
				grecaptcha.execute(this.siteKey, { action }).then(resolve).catch(reject);
			});
		});
	}

	/**
	 * Ensures the Google reCAPTCHA script is loaded exactly once.
	 * @returns Promise that resolves when script is ready.
	 */
	private async ensureScriptLoadedAsync(): Promise<void> {
		if (this.scriptLoaded) {
			return;
		}

		const scriptElement: HTMLScriptElement = this.document.createElement("script");
		scriptElement.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
		scriptElement.async = true;

		await new Promise<void>((resolve, reject) => {
			scriptElement.onload = (): void => resolve();
			scriptElement.onerror = (): void => reject(new Error("Failed to load reCAPTCHA script"));
			this.document.head.appendChild(scriptElement);
		});

		this.scriptLoaded = true;
	}
}
```

### 4.3 Update Auth Models

**File:** `SeventySix.Client/src/app/shared/models/auth.model.ts`

Add to `LoginRequest` interface:

```typescript
/**
 * reCAPTCHA v3 token for bot protection.
 * Required when reCAPTCHA is enabled on server.
 */
recaptchaToken?: string;
```

### 4.4 Update Login Component

**File:** `SeventySix.Client/src/app/shared/pages/login/login.component.ts`

Integration points:

1. Inject `RecaptchaService`
2. Execute reCAPTCHA before API call
3. Include token in login request

```typescript
// In the component class
private readonly recaptchaService: RecaptchaService =
	inject(RecaptchaService);

async onSubmitAsync(): Promise<void>
{
	// Get reCAPTCHA token (null if disabled)
	const recaptchaToken: string | null =
		await this.recaptchaService.executeAsync("login");

	// Include in request
	const loginRequest: LoginRequest =
	{
		...this.form.value,
		recaptchaToken
	};

	// Proceed with login...
}
```

---

## Phase 5: Testing Strategy (80/20 Rule)

### 5.1 Critical Path Tests (Server)

**File:** `SeventySix.Server/Tests/SeventySix.Domains.Tests/Identity/Services/RecaptchaServiceTests.cs`

| Test                                                         | Priority | Description                          |
| ------------------------------------------------------------ | -------- | ------------------------------------ |
| `ValidateAsync_ValidToken_ReturnsSuccessAsync`               | High     | Happy path with mocked HTTP response |
| `ValidateAsync_DisabledInSettings_ReturnsBypassedAsync`      | High     | Verify bypass works                  |
| `ValidateAsync_ScoreBelowThreshold_ReturnsFailureAsync`      | High     | Score threshold enforcement          |
| `ValidateAsync_ActionMismatch_ReturnsFailureAsync`           | Medium   | Action validation                    |
| `ValidateAsync_MonthlyRateLimitExceeded_ReturnsFailureAsync` | Medium   | Monthly interval enforcement         |

### 5.2 ThirdPartyApiLimitSettings Tests

**File:** `SeventySix.Server/Tests/SeventySix.Domains.Tests/ApiTracking/Settings/ThirdPartyApiLimitSettingsTests.cs`

| Test                                                     | Priority | Description                             |
| -------------------------------------------------------- | -------- | --------------------------------------- |
| `GetLimit_MonthlyInterval_ReturnsMonthlyLimitAsync`      | High     | Monthly limit retrieval                 |
| `GetLimit_DailyInterval_ReturnsDailyLimitAsync`          | High     | Daily limit retrieval (backward compat) |
| `GetLimitInterval_ReturnsConfiguredIntervalAsync`        | High     | Interval detection                      |
| `IsApiRateLimitEnabled_MasterDisabled_ReturnsFalseAsync` | Medium   | Master switch behavior                  |

### 5.3 Integration Tests

**File:** `SeventySix.Server/Tests/SeventySix.Api.Tests/Controllers/AuthRecaptchaTests.cs`

| Test                                                         | Priority | Description                 |
| ------------------------------------------------------------ | -------- | --------------------------- |
| `LoginAsync_MissingToken_WhenEnabled_ReturnsBadRequestAsync` | High     | Token required when enabled |
| `LoginAsync_InvalidToken_ReturnsUnauthorizedAsync`           | High     | Bad token handling          |

### 5.4 Client Tests

**File:** `SeventySix.Client/src/app/shared/services/recaptcha.service.spec.ts`

| Test                                            | Priority | Description                  |
| ----------------------------------------------- | -------- | ---------------------------- |
| `executeAsync should return null when disabled` | High     | Bypass behavior              |
| `executeAsync should load script once`          | Medium   | Script loading deduplication |

---

## Phase 6: OWASP Security Considerations

### 6.1 Already Implemented (Existing Infrastructure)

| OWASP Risk                         | Implementation                    | Location                                              |
| ---------------------------------- | --------------------------------- | ----------------------------------------------------- |
| A01:2021 Broken Access Control     | JWT + Role-based authorization    | `AuthController`, `[Authorize]` attributes            |
| A02:2021 Cryptographic Failures    | HTTPS enforcement, secure cookies | `SecuritySettings`, `SmartHttpsRedirectionMiddleware` |
| A03:2021 Injection                 | Parameterized queries via EF Core | All repositories                                      |
| A04:2021 Insecure Design           | Rate limiting on auth endpoints   | `RateLimitingRegistration`                            |
| A05:2021 Security Misconfiguration | Security headers middleware       | `AttributeBasedSecurityHeadersMiddleware`             |
| A07:2021 Auth Failures             | Account lockout, token expiration | `AuthSettings`, `JwtSettings`                         |

### 6.2 reCAPTCHA Addresses

| OWASP Risk               | How reCAPTCHA Helps                 |
| ------------------------ | ----------------------------------- |
| A04:2021 Insecure Design | Prevents automated attacks on forms |
| A07:2021 Auth Failures   | Mitigates credential stuffing       |
| Crawlers/Scrapers        | Score-based bot detection           |

### 6.3 Additional Recommendations (Future Phases)

| Enhancement             | Priority | Rationale                     |
| ----------------------- | -------- | ----------------------------- |
| Account Lockout Logging | Medium   | Detect brute force patterns   |
| Suspicious IP Tracking  | Low      | Build threat intelligence     |
| Password Breach Check   | Low      | Have I Been Pwned integration |

---

## Phase 7: File Structure Summary

### New Files

```
SeventySix.Server/
├── SeventySix.Domains/
│   ├── ApiTracking/
│   │   └── Constants/
│   │       └── ExternalApiConstants.cs              # MODIFY (add GoogleRecaptcha)
│   │   └── Settings/
│   │       └── ThirdPartyApiLimitSettings.cs        # MODIFY (add LimitInterval enum, MonthlyLimit)
│   └── Identity/
│       ├── Constants/
│       │   └── RecaptchaActionConstants.cs          # NEW
│       ├── Interfaces/
│       │   └── IRecaptchaService.cs                 # NEW
│       ├── POCOs/
│       │   ├── Responses/
│       │   │   └── RecaptchaVerifyResponse.cs       # NEW (internal)
│       │   └── Results/
│       │       └── RecaptchaValidationResult.cs     # NEW
│       ├── Services/
│       │   └── RecaptchaService.cs                  # NEW
│       └── Settings/
│           └── RecaptchaSettings.cs                 # NEW

Tests/
└── SeventySix.Domains.Tests/
    ├── ApiTracking/
    │   └── Settings/
    │       └── ThirdPartyApiLimitSettingsTests.cs   # NEW
    └── Identity/
        └── Services/
            └── RecaptchaServiceTests.cs             # NEW
└── SeventySix.Api.Tests/
    └── Controllers/
        └── AuthRecaptchaTests.cs                    # NEW

SeventySix.Client/
├── src/
│   ├── app/
│   │   └── shared/
│   │       └── services/
│   │           ├── recaptcha.service.ts             # NEW
│   │           └── recaptcha.service.spec.ts        # NEW
│   └── environments/
│       ├── environment.ts                           # MODIFY
│       └── environment.development.ts               # MODIFY
```

### Modified Files

```
Root/
├── .env.example                                     # Add RECAPTCHA_* variables
├── docker-compose.production.yml                   # Add Recaptcha env mappings

SeventySix.Server/
├── SeventySix.Api/
│   ├── appsettings.json                             # Add Recaptcha section, update ThirdPartyApiLimits
│   ├── appsettings.Development.json                 # Add Recaptcha disabled
│   ├── appsettings.Test.json                        # Add Recaptcha disabled
│   └── Registration/
│       └── IdentityRegistration.cs                  # Register IRecaptchaService
├── SeventySix.Domains/
│   ├── ApiTracking/
│   │   ├── Constants/
│   │   │   └── ExternalApiConstants.cs              # Add GoogleRecaptcha constant
│   │   ├── Interfaces/
│   │   │   └── IRateLimitingService.cs              # Add interval-aware methods
│   │   ├── Services/
│   │   │   └── RateLimitingService.cs               # Add monthly interval support
│   │   └── Settings/
│   │       └── ThirdPartyApiLimitSettings.cs        # Add LimitInterval, MonthlyLimit
│   └── Identity/
│       ├── Commands/
│       │   ├── LoginUserCommandHandler.cs           # Add reCAPTCHA validation
│       │   └── RegisterUserCommandHandler.cs        # Add reCAPTCHA validation
│       └── POCOs/
│           └── Requests/
│               ├── LoginRequest.cs                  # Add RecaptchaToken property
│               └── RegisterRequest.cs               # Add RecaptchaToken property

SeventySix.Client/
└── src/
    └── app/
        └── shared/
            ├── models/
            │   └── auth.model.ts                    # Add recaptchaToken to requests
            ├── pages/
            │   └── login/
            │       └── login.component.ts           # Integrate RecaptchaService
            └── services/
                └── auth.service.ts                  # Pass token in requests
```

---

## Phase 8: Implementation Order

### Sprint 1: ThirdPartyApiLimits Enhancement (Foundation)

1. ☐ Add `LimitInterval` enum to `ThirdPartyApiLimitSettings.cs`
2. ☐ Add `MonthlyLimit` property to `ThirdPartyApiLimit` record
3. ☐ Add `GetLimit()` and `GetLimitInterval()` methods
4. ☐ Update `IRateLimitingService` interface with interval support
5. ☐ Update `RateLimitingService` with monthly date range calculation
6. ☐ Write unit tests for `ThirdPartyApiLimitSettings`
7. ☐ Update appsettings to use new structure (backward compatible)

### Sprint 2: Backend reCAPTCHA Implementation

1. ☐ Add `GoogleRecaptcha` to `ExternalApiConstants.cs`
2. ☐ Add GoogleRecaptcha to `ThirdPartyApiLimits` with `MonthlyLimit: 10000`
3. ☐ Create `RecaptchaSettings.cs`
4. ☐ Add Recaptcha section to appsettings files
5. ☐ Update `.env.example` with reCAPTCHA variables
6. ☐ Update `docker-compose.production.yml` with env mappings
7. ☐ Create `IRecaptchaService.cs`
8. ☐ Create `RecaptchaValidationResult.cs`
9. ☐ Create `RecaptchaVerifyResponse.cs`
10. ☐ Create `RecaptchaActionConstants.cs`
11. ☐ Implement `RecaptchaService.cs`
12. ☐ Write unit tests for `RecaptchaService`

### Sprint 3: Backend Integration

1. ☐ Register `IRecaptchaService` in DI
2. ☐ Add `RecaptchaToken` to `LoginRequest.cs`
3. ☐ Modify `LoginUserCommandHandler.cs`
4. ☐ Add `RecaptchaToken` to `RegisterRequest.cs`
5. ☐ Modify `RegisterUserCommandHandler.cs`
6. ☐ Write integration tests

### Sprint 4: Frontend Implementation

1. ☐ Create `RecaptchaService` (custom, NOT ng-recaptcha)
2. ☐ Update environment configs
3. ☐ Add `recaptchaToken` to auth models
4. ☐ Integrate with login component
5. ☐ Integrate with register component
6. ☐ Write service tests

### Sprint 5: Testing & Documentation

1. ☐ End-to-end testing
2. ☐ Security review (verify no secrets in logs/responses)
3. ☐ Update API documentation
4. ☐ Monitor assessment usage in ThirdPartyApiRequests dashboard

---

## Phase 9: Configuration Checklist

### Google reCAPTCHA Setup

1. [ ] Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)
2. [ ] Register a new site with reCAPTCHA v3
3. [ ] Add domains: `localhost`, `yourdomain.com`
4. [ ] Copy Site Key (public)
5. [ ] Copy Secret Key (private)
6. [ ] Add to `.env` file (following `.env.example` pattern)

### Environment Setup (Following Existing Pattern)

**Development (.env file):**

```dotenv
# Copy from .env.example and fill in your values
RECAPTCHA_SITE_KEY=your-site-key-from-google
RECAPTCHA_SECRET_KEY=your-secret-key-from-google
```

**Production:**

- Store keys in same `.env` file used for Docker deployment
- Or use Azure Key Vault / secret manager with environment variable injection
- Never commit actual keys to source control

---

## Monitoring & Alerts

### Key Metrics to Track (ThirdPartyApiRequests Dashboard)

| Metric                               | Threshold    | Action                            |
| ------------------------------------ | ------------ | --------------------------------- |
| Monthly Call Count (GoogleRecaptcha) | > 8,000      | Alert approaching free tier limit |
| Monthly Assessments                  | > 9,500      | Critical alert - near limit       |
| Low Score Rate                       | > 10%        | Investigate bot activity          |
| Validation Failures                  | Sudden spike | Check for API issues              |
| reCAPTCHA Latency                    | > 500ms      | Monitor external dependency       |

### Logging Strategy

```csharp
// Log levels for reCAPTCHA events (following existing patterns)
logger.LogInformation(
	"reCAPTCHA validated: Action={Action}, Score={Score}",
	action,
	score);
logger.LogWarning(
	"reCAPTCHA low score: Action={Action}, Score={Score}",
	action,
	score);
logger.LogError(
	"reCAPTCHA validation failed: {ErrorCodes}",
	string.Join(", ", errorCodes));

// NEVER log secret key or full tokens
```

---

## Cost Projection

| Scenario       | Monthly Assessments | Cost                     |
| -------------- | ------------------- | ------------------------ |
| Low Traffic    | < 5,000             | $0 (Free)                |
| Medium Traffic | < 10,000            | $0 (Free)                |
| High Traffic   | 10,000 - 100,000    | $8/month (Standard tier) |

**Recommendation:** Start with Essentials (free), upgrade to Standard if needed.

---

## Rollback Plan

If issues arise post-deployment:

1. **Quick Disable:** Set `"Recaptcha:Enabled": false` in appsettings
2. **Full Rollback:** Revert to previous deployment
3. **Partial:** Disable only for specific environments via config hierarchy

---

## Success Criteria

- [ ] reCAPTCHA validates successfully on login/register
- [ ] Bots with low scores are blocked
- [ ] No user friction (invisible v3)
- [ ] API calls tracked in ThirdPartyApiRequests with monthly intervals
- [ ] Monitoring shows assessment usage (monthly, not daily)
- [ ] Secrets stored in `.env` only (verified not in appsettings values or git)
- [ ] All tests pass
- [ ] Security review approved

---

## References

- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Pricing](https://cloud.google.com/security/products/recaptcha)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [ng-recaptcha GitHub](https://github.com/DethAriel/ng-recaptcha) - Evaluated but **NOT recommended** for Angular 21 (unmaintained, incompatible)
