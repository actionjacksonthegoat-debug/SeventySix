// <copyright file="OAuthRedirectValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure;

/// <summary>
/// Unit tests for <see cref="OAuthRedirectValidator"/>.
/// Validates the security-critical host-matching logic used to prevent open redirect attacks
/// and break CodeQL taint chains (cs/web/unvalidated-url-redirection).
/// </summary>
public sealed class OAuthRedirectValidatorUnitTests
{
	private static OAuthProviderSettings GitHubSettings =>
		new()
		{
			Provider = "GitHub",
			AuthorizationEndpoint = "https://github.com/login/oauth/authorize",
		};

	/// <summary>
	/// Valid URL whose host matches the configured authorization endpoint returns a non-null Uri.
	/// </summary>
	[Fact]
	public void GetValidatedUri_ValidHostMatch_ReturnsUri()
	{
		// Arrange
		string url =
			"https://github.com/login/oauth/authorize?client_id=abc&state=xyz";

		// Act
		Uri? result =
			OAuthRedirectValidator.GetValidatedUri(url, GitHubSettings);

		// Assert
		result.ShouldNotBeNull();
		result.AbsoluteUri.ShouldStartWith("https://github.com/");
	}

	/// <summary>
	/// URL whose host does not match the configured authorization endpoint returns null.
	/// </summary>
	[Theory]
	[InlineData("https://evil.com/steal?state=xyz")]
	[InlineData("https://evil-github.com/login/oauth/authorize")]
	[InlineData("https://github.com.evil.com/login/oauth/authorize")]
	[InlineData("https://notgithub.com/login/oauth/authorize")]
	public void GetValidatedUri_HostMismatch_ReturnsNull(string url)
	{
		// Act
		Uri? result =
			OAuthRedirectValidator.GetValidatedUri(url, GitHubSettings);

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Malformed URL string returns null without throwing.
	/// </summary>
	[Theory]
	[InlineData("not-a-url")]
	[InlineData("")]
	[InlineData("   ")]
	[InlineData("javascript:alert(1)")]
	public void GetValidatedUri_MalformedUrl_ReturnsNull(string url)
	{
		// Act
		Uri? result =
			OAuthRedirectValidator.GetValidatedUri(url, GitHubSettings);

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Provider settings with a malformed authorization endpoint returns null.
	/// </summary>
	[Fact]
	public void GetValidatedUri_MalformedEndpoint_ReturnsNull()
	{
		// Arrange
		string url =
			"https://github.com/login/oauth/authorize?state=xyz";

		OAuthProviderSettings badSettings =
			new()
			{
				Provider = "GitHub",
				AuthorizationEndpoint = "not-a-valid-endpoint",
			};

		// Act
		Uri? result =
			OAuthRedirectValidator.GetValidatedUri(url, badSettings);

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Host comparison is case-insensitive: GitHub.COM matches github.com.
	/// </summary>
	[Fact]
	public void GetValidatedUri_HostCaseInsensitive_ReturnsUri()
	{
		// Arrange
		string url =
			"https://GitHub.COM/login/oauth/authorize?state=xyz";

		// Act
		Uri? result =
			OAuthRedirectValidator.GetValidatedUri(url, GitHubSettings);

		// Assert
		result.ShouldNotBeNull();
	}

	/// <summary>
	/// Subdomain-of-expected-host attack returns null (evil-github.com vs github.com).
	/// </summary>
	[Fact]
	public void GetValidatedUri_SubdomainAttack_ReturnsNull()
	{
		// Arrange
		string maliciousUrl =
			"https://github.com.attacker.io/login/oauth/authorize?state=xyz";

		// Act
		Uri? result =
			OAuthRedirectValidator.GetValidatedUri(maliciousUrl, GitHubSettings);

		// Assert
		result.ShouldBeNull();
	}
}