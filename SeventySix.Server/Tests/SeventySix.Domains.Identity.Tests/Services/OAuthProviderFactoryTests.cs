// <copyright file="OAuthProviderFactoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="OAuthProviderFactory"/>.
/// Validates strategy resolution by provider name, case insensitivity,
/// and error handling for unknown providers.
/// </summary>
public class OAuthProviderFactoryTests
{
	private const string TestProvider = "GitHub";
	private const string UnknownProvider = "unknown";

	/// <summary>
	/// Verifies GetStrategy resolves "github" (lowercase) to GitHubOAuthStrategy.
	/// </summary>
	[Fact]
	public void GetStrategy_GitHub_ReturnsGitHubStrategy()
	{
		// Arrange
		IOAuthProviderStrategy gitHubStrategy =
			CreateMockStrategy(TestProvider);

		OAuthProviderFactory factory =
			new([gitHubStrategy]);

		// Act
		IOAuthProviderStrategy result =
			factory.GetStrategy("github");

		// Assert
		result.ShouldBeSameAs(gitHubStrategy);
	}

	/// <summary>
	/// Verifies GetStrategy throws for an unknown provider.
	/// </summary>
	[Fact]
	public void GetStrategy_Unknown_ThrowsInvalidOperationException()
	{
		// Arrange
		IOAuthProviderStrategy gitHubStrategy =
			CreateMockStrategy(TestProvider);

		OAuthProviderFactory factory =
			new([gitHubStrategy]);

		// Act & Assert
		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(() =>
				factory.GetStrategy(UnknownProvider));

		exception.Message.ShouldContain(UnknownProvider);
	}

	/// <summary>
	/// Verifies GetStrategy resolves regardless of casing.
	/// </summary>
	[Theory]
	[InlineData("GitHub")]
	[InlineData("github")]
	[InlineData("GITHUB")]
	public void GetStrategy_CaseInsensitive_ReturnsStrategy(string providerName)
	{
		// Arrange
		IOAuthProviderStrategy gitHubStrategy =
			CreateMockStrategy(TestProvider);

		OAuthProviderFactory factory =
			new([gitHubStrategy]);

		// Act
		IOAuthProviderStrategy result =
			factory.GetStrategy(providerName);

		// Assert
		result.ShouldBeSameAs(gitHubStrategy);
	}

	/// <summary>
	/// Verifies GetRegisteredProviders returns all registered provider names.
	/// </summary>
	[Fact]
	public void GetRegisteredProviders_MultipleRegistered_ReturnsAllRegisteredProviders()
	{
		// Arrange
		IOAuthProviderStrategy gitHubStrategy =
			CreateMockStrategy(TestProvider);

		IOAuthProviderStrategy googleStrategy =
			CreateMockStrategy("Google");

		OAuthProviderFactory factory =
			new([gitHubStrategy, googleStrategy]);

		// Act
		IReadOnlyList<string> providers =
			factory.GetRegisteredProviders();

		// Assert
		providers.Count.ShouldBe(2);
		providers.ShouldContain(TestProvider);
		providers.ShouldContain("Google");
	}

	/// <summary>
	/// Creates a mock OAuth provider strategy with the specified name.
	/// </summary>
	/// <param name="providerName">
	/// The provider name to return.
	/// </param>
	/// <returns>
	/// A configured mock strategy.
	/// </returns>
	private static IOAuthProviderStrategy CreateMockStrategy(string providerName)
	{
		IOAuthProviderStrategy strategy =
			Substitute.For<IOAuthProviderStrategy>();

		strategy.ProviderName.Returns(providerName);

		return strategy;
	}
}