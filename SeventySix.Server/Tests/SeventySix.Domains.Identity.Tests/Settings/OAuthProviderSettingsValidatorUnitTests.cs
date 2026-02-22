// <copyright file="OAuthProviderSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Identity.Tests.Settings;

/// <summary>
/// Unit tests for OAuthProviderSettingsValidator.
/// </summary>
public sealed class OAuthProviderSettingsValidatorUnitTests
{
	private readonly OAuthProviderSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidProvider_PassesValidation()
	{
		// Arrange
		OAuthProviderSettings settings = CreateValidSettings();

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EmptyProvider_FailsValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { Provider = string.Empty };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(provider => provider.Provider);
	}

	[Fact]
	public void Validate_EmptyClientId_FailsValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { ClientId = string.Empty };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(provider => provider.ClientId);
	}

	[Fact]
	public void Validate_EmptyClientSecret_FailsValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { ClientSecret = string.Empty };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(provider => provider.ClientSecret);
	}

	[Fact]
	public void Validate_EmptyRedirectUri_FailsValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { RedirectUri = string.Empty };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(provider => provider.RedirectUri);
	}

	[Fact]
	public void Validate_RelativeRedirectUri_PassesValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { RedirectUri = ApiEndpoints.Auth.OAuth.GitHubCallback };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(provider => provider.RedirectUri);
	}

	[Fact]
	public void Validate_AbsoluteRedirectUri_PassesValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { RedirectUri = "https://example.com/oauth/callback" };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(provider => provider.RedirectUri);
	}

	[Fact]
	public void Validate_InvalidRedirectUri_FailsValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { RedirectUri = "not-a-valid-uri" };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(provider => provider.RedirectUri);
	}

	[Fact]
	public void Validate_EmptyAuthorizationEndpoint_FailsValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { AuthorizationEndpoint = string.Empty };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(provider => provider.AuthorizationEndpoint);
	}

	[Fact]
	public void Validate_EmptyTokenEndpoint_FailsValidation()
	{
		// Arrange
		OAuthProviderSettings settings =
			CreateValidSettings() with { TokenEndpoint = string.Empty };

		// Act
		TestValidationResult<OAuthProviderSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(provider => provider.TokenEndpoint);
	}

	private static OAuthProviderSettings CreateValidSettings() =>
		new()
		{
			Provider = "GitHub",
			ClientId = "client-id-123",
			ClientSecret = "client-secret-abc",
			RedirectUri = ApiEndpoints.Auth.OAuth.GitHubCallback,
			AuthorizationEndpoint = "https://github.com/login/oauth/authorize",
			TokenEndpoint = "https://github.com/login/oauth/access_token",
		};
}