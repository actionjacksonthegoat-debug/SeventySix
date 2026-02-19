// <copyright file="ConfigControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SeventySix.Api.Controllers;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for ConfigController.
/// </summary>
/// <remarks>
/// Tests controller response shape and correct mapping of server settings to client-visible flags.
/// </remarks>
public sealed class ConfigControllerTests
{
	/// <summary>
	/// Tests that GetFeatureFlags returns OK with all expected feature flag values.
	/// </summary>
	[Fact]
	public void GetFeatureFlags_WithDefaultSettings_ReturnsMfaAndOAuthState()
	{
		// Arrange
		IOptions<MfaSettings> mfaSettings =
			Options.Create(new MfaSettings { Enabled = true });

		IOptions<TotpSettings> totpSettings =
			Options.Create(new TotpSettings { Enabled = false });

		IOptions<AuthSettings> authSettings =
			Options.Create(new AuthSettings
			{
				OAuth = new OAuthSettings { Enabled = false, Providers = [] }
			});

		IOptions<JwtSettings> jwtSettings =
			Options.Create(new JwtSettings
			{
				SecretKey = new string('x', 32),
				Issuer = "test-issuer",
				Audience = "test-audience",
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 1,
				RefreshTokenRememberMeExpirationDays = 14,
				AbsoluteSessionTimeoutDays = 30,
				ClockSkewMinutes = 1,
				TokenRefreshBufferSeconds = 60
			});

		IAltchaService altchaService =
			IdentityMockFactory.CreateAltchaService(isEnabled: true);

		ConfigController controller =
			new(
				mfaSettings,
				totpSettings,
				authSettings,
				jwtSettings,
				altchaService);

		// Act
		ActionResult<FeatureFlagsResponse> result =
			controller.GetFeatureFlags();

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		FeatureFlagsResponse flags =
			okResult.Value.ShouldBeOfType<FeatureFlagsResponse>();

		flags.MfaEnabled.ShouldBeTrue();
		flags.TotpEnabled.ShouldBeFalse();
		flags.OAuthEnabled.ShouldBeFalse();
		flags.OAuthProviders.ShouldBeEmpty();
		flags.AltchaEnabled.ShouldBeTrue();
		flags.TokenRefreshBufferSeconds.ShouldBe(60);
	}

	/// <summary>
	/// Tests that TokenRefreshBufferSeconds in the response exactly matches the value in JwtSettings.
	/// Ensures the client receives the server-configured buffer, not a hardcoded value.
	/// </summary>
	[Theory]
	[InlineData(30)]
	[InlineData(60)]
	[InlineData(120)]
	public void GetFeatureFlags_TokenRefreshBufferSeconds_MatchesJwtSettings(int bufferSeconds)
	{
		// Arrange
		IOptions<JwtSettings> jwtSettings =
			Options.Create(new JwtSettings
			{
				SecretKey = new string('x', 32),
				Issuer = "test-issuer",
				Audience = "test-audience",
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 1,
				RefreshTokenRememberMeExpirationDays = 14,
				AbsoluteSessionTimeoutDays = 30,
				ClockSkewMinutes = 1,
				TokenRefreshBufferSeconds = bufferSeconds
			});

		ConfigController controller =
			new(
				Options.Create(new MfaSettings { Enabled = true }),
				Options.Create(new TotpSettings { Enabled = false }),
				Options.Create(new AuthSettings
				{
					OAuth = new OAuthSettings { Enabled = false, Providers = [] }
				}),
				jwtSettings,
				IdentityMockFactory.CreateAltchaService());

		// Act
		ActionResult<FeatureFlagsResponse> result =
			controller.GetFeatureFlags();

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		FeatureFlagsResponse flags =
			okResult.Value.ShouldBeOfType<FeatureFlagsResponse>();

		flags.TokenRefreshBufferSeconds.ShouldBe(bufferSeconds);
	}

	/// <summary>
	/// Tests that OAuth provider names are included when OAuth is enabled.
	/// </summary>
	[Fact]
	public void GetFeatureFlags_WithOAuthEnabled_ReturnsProviderNames()
	{
		// Arrange
		IOptions<AuthSettings> authSettings =
			Options.Create(new AuthSettings
			{
				OAuth = new OAuthSettings
				{
					Enabled = true,
					Providers =
						[
							new OAuthProviderSettings { Provider = "GitHub" },
							new OAuthProviderSettings { Provider = "Google" }
						]
				}
			});

		ConfigController controller =
			new(
				Options.Create(new MfaSettings()),
				Options.Create(new TotpSettings()),
				authSettings,
				Options.Create(new JwtSettings
				{
					SecretKey = new string('x', 32),
					Issuer = "test-issuer",
					Audience = "test-audience",
					AccessTokenExpirationMinutes = 15,
					RefreshTokenExpirationDays = 1,
					RefreshTokenRememberMeExpirationDays = 14,
					AbsoluteSessionTimeoutDays = 30,
					ClockSkewMinutes = 1,
					TokenRefreshBufferSeconds = 60
				}),
				IdentityMockFactory.CreateAltchaService());

		// Act
		ActionResult<FeatureFlagsResponse> result =
			controller.GetFeatureFlags();

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		FeatureFlagsResponse flags =
			okResult.Value.ShouldBeOfType<FeatureFlagsResponse>();

		flags.OAuthEnabled.ShouldBeTrue();
		flags.OAuthProviders.ShouldBe(["GitHub", "Google"]);
	}
}