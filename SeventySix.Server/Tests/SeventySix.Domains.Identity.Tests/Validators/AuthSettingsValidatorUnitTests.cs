// <copyright file="AuthSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for AuthSettingsValidator.
/// </summary>
public sealed class AuthSettingsValidatorUnitTests
{
	private readonly AuthSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		AuthSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<AuthSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ZeroLockoutMaxFailedAttempts_FailsValidation()
	{
		// Arrange
		AuthSettings settings =
			CreateValidSettings() with
			{
				Lockout = new LockoutSettings
				{
					Enabled = true,
					MaxFailedAttempts = 0,
					LockoutDurationMinutes = 15,
				},
			};

		// Act
		TestValidationResult<AuthSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	[Fact]
	public void Validate_ZeroPasswordMinLength_FailsValidation()
	{
		// Arrange
		AuthSettings settings =
			CreateValidSettings() with
			{
				Password = CreateValidPasswordSettings() with { MinLength = 0 },
			};

		// Act
		TestValidationResult<AuthSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	[Fact]
	public void Validate_ZeroLoginAttemptsPerMinute_FailsValidation()
	{
		// Arrange
		AuthSettings settings =
			CreateValidSettings() with
			{
				RateLimit = CreateValidRateLimitSettings() with { LoginAttemptsPerMinute = 0 },
			};

		// Act
		TestValidationResult<AuthSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	[Fact]
	public void Validate_DisableRotationTrueInProduction_ReturnsError()
	{
		// Arrange
		string? previousValue =
			Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

		try
		{
			Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production");

			AuthSettings settings =
				CreateValidSettings() with
				{
					Token = new TokenSettings
					{
						MaxActiveSessionsPerUser = 5,
						DisableRotation = true,
					},
				};

			// Act
			TestValidationResult<AuthSettings> result =
				Validator.TestValidate(settings);

			// Assert
			result
				.ShouldHaveValidationErrorFor(
					auth => auth.Token.DisableRotation)
				.WithErrorMessage("Token rotation must NOT be disabled in production.");
		}
		finally
		{
			Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", previousValue);
		}
	}

	[Fact]
	public void Validate_DisableRotationTrueInDevelopment_ReturnsValid()
	{
		// Arrange
		string? previousValue =
			Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

		try
		{
			Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

			AuthSettings settings =
				CreateValidSettings() with
				{
					Token = new TokenSettings
					{
						MaxActiveSessionsPerUser = 5,
						DisableRotation = true,
					},
				};

			// Act
			TestValidationResult<AuthSettings> result =
				Validator.TestValidate(settings);

			// Assert
			result.ShouldNotHaveAnyValidationErrors();
		}
		finally
		{
			Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", previousValue);
		}
	}

	private static AuthSettings CreateValidSettings() =>
		new()
		{
			Lockout = new LockoutSettings
			{
				Enabled = true,
				MaxFailedAttempts = 5,
				LockoutDurationMinutes = 15,
			},
			Password = CreateValidPasswordSettings(),
			RateLimit = CreateValidRateLimitSettings(),
			Cookie = new AuthCookieSettings
			{
				RefreshTokenCookieName = "refresh_token",
				OAuthStateCookieName = "oauth_state",
				OAuthCodeVerifierCookieName = "oauth_verifier",
			},
			Token = new TokenSettings
			{
				MaxActiveSessionsPerUser = 5,
			},
			BreachedPassword = new BreachedPasswordSettings
			{
				Enabled = false,
				MinBreachCount = 1,
				ApiTimeoutMs = 5000,
			},
		};

	private static PasswordSettings CreateValidPasswordSettings() =>
		new()
		{
			MinLength = 8,
			Argon2 = new Argon2Settings
			{
				MemorySize = 65536,
				Iterations = 3,
				DegreeOfParallelism = 4,
			},
		};

	private static AuthRateLimitSettings CreateValidRateLimitSettings() =>
		new()
		{
			LoginAttemptsPerMinute = 10,
			RegisterAttemptsPerHour = 5,
			TokenRefreshPerMinute = 30,
			AltchaChallengePerMinute = 20,
			ClientLogsPerMinute = 60,
			MfaVerifyPerMinute = 10,
			MfaResendPerMinute = 5,
		};
}