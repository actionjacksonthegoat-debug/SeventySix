// <copyright file="OAuthCodeExchangeServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Constants;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for OAuthCodeExchangeService.
/// Tests code generation, storage, and one-time exchange pattern.
/// </summary>
public class OAuthCodeExchangeServiceTests
{
	private readonly DateTime FixedExpiresAt =
		TestDates.FutureUtc;

	private const string TestEmail = "test@example.com";
	private const string? TestFullName = null;

	/// <summary>
	/// Creates an OAuthCodeExchangeService with a memory-only FusionCache.
	/// </summary>
	/// <returns>
	/// A configured OAuthCodeExchangeService instance.
	/// </returns>
	private static OAuthCodeExchangeService CreateService()
	{
		// Build a memory-only FusionCache using DI for testing
		ServiceCollection services = new();
		services.AddFusionCache(CacheNames.Identity);

		ServiceProvider provider =
			services.BuildServiceProvider();

		IFusionCacheProvider cacheProvider =
			provider.GetRequiredService<IFusionCacheProvider>();

		return new OAuthCodeExchangeService(cacheProvider);
	}

	#region StoreTokens Tests

	/// <summary>
	/// Verifies StoreTokens returns a non-empty code for valid input.
	/// </summary>
	[Fact]
	public void StoreTokens_ValidInput_ReturnsNonEmptyCode()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		// Act
		string code =
			service.StoreTokens(
			"access-token",
			"refresh-token",
			FixedExpiresAt,
			TestEmail,
			TestFullName,
			false);

		// Assert
		code.ShouldNotBeNull();
		code.ShouldNotBeEmpty();
	}

	/// <summary>
	/// Verifies multiple StoreTokens invocations produce different codes.
	/// </summary>
	[Fact]
	public void StoreTokens_MultipleInvocations_ReturnsDifferentCodes()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		// Act
		string code1 =
			service.StoreTokens(
			"access-token-1",
			"refresh-token-1",
			FixedExpiresAt,
			TestEmail,
			TestFullName,
			false);

		string code2 =
			service.StoreTokens(
			"access-token-2",
			"refresh-token-2",
			FixedExpiresAt,
			TestEmail,
			TestFullName,
			false);

		// Assert
		code1.ShouldNotBe(code2);
	}

	/// <summary>
	/// Verifies generated code is base64url-safe (url friendly characters only).
	/// </summary>
	[Fact]
	public void StoreTokens_GeneratesBase64UrlSafeCode()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		// Act
		string code =
			service.StoreTokens(
			"access-token",
			"refresh-token",
			FixedExpiresAt,
			TestEmail,
			TestFullName,
			false);

		// Assert - Base64url uses only these characters
		code.ShouldMatch("^[A-Za-z0-9_-]+$");
	}

	#endregion

	#region ExchangeCode Tests

	/// <summary>
	/// Verifies ExchangeCode returns stored tokens and metadata for a valid code.
	/// </summary>
	[Fact]
	public void ExchangeCode_ValidCode_ReturnsTokens()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		string accessToken = "test-access-token";
		string refreshToken = "test-refresh-token";

		string code =
			service.StoreTokens(
			accessToken,
			refreshToken,
			FixedExpiresAt,
			TestEmail,
			TestFullName,
			false);

		// Act
		OAuthCodeExchangeResult? result =
			service.ExchangeCode(code);

		// Assert
		result.ShouldNotBeNull();
		result.AccessToken.ShouldBe(accessToken);
		result.RefreshToken.ShouldBe(refreshToken);
		result.ExpiresAt.ShouldBe(FixedExpiresAt);
		result.Email.ShouldBe(TestEmail);
		result.FullName.ShouldBe(TestFullName);
		result.RequiresPasswordChange.ShouldBeFalse();
	}

	/// <summary>
	/// Verifies ExchangeCode returns null for an invalid code.
	/// </summary>
	[Fact]
	public void ExchangeCode_InvalidCode_ReturnsNull()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		// Act
		OAuthCodeExchangeResult? result =
			service.ExchangeCode("invalid-code");

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Verifies exchanging the same code twice only returns tokens on the first call.
	/// </summary>
	[Fact]
	public void ExchangeCode_SameCodeTwice_SecondCallReturnsNull()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		string code =
			service.StoreTokens(
			"access-token",
			"refresh-token",
			FixedExpiresAt,
			TestEmail,
			TestFullName,
			false);

		// Act
		OAuthCodeExchangeResult? firstResult =
			service.ExchangeCode(code);

		OAuthCodeExchangeResult? secondResult =
			service.ExchangeCode(code);

		// Assert
		firstResult.ShouldNotBeNull();
		secondResult.ShouldBeNull();
	}

	/// <summary>
	/// Verifies ExchangeCode returns null when an empty code is provided.
	/// </summary>
	[Fact]
	public void ExchangeCode_EmptyCode_ReturnsNull()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		// Act
		OAuthCodeExchangeResult? result =
			service.ExchangeCode(string.Empty);

		// Assert
		result.ShouldBeNull();
	}

	#endregion

	#region Security Tests

	/// <summary>
	/// Verifies generated code length meets expected base64url size.
	/// </summary>
	[Fact]
	public void StoreTokens_CodeLengthIsSecure()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		// Act
		string code =
			service.StoreTokens(
			"access-token",
			"refresh-token",
			FixedExpiresAt,
			TestEmail,
			TestFullName,
			false);

		// Assert - 32 bytes = 43 base64url characters (no padding)
		code.Length.ShouldBe(43);
	}

	/// <summary>
	/// Verifies different tokens produce unique codes over many invocations.
	/// </summary>
	[Fact]
	public void StoreTokens_DifferentTokens_ProduceDistinctCodes()
	{
		// Arrange
		OAuthCodeExchangeService service = CreateService();

		HashSet<string> codes = [];

		// Act - Generate many codes to verify uniqueness
		for (int index = 0; index < 100; index++)
		{
			string code =
				service.StoreTokens(
				$"access-token-{index}",
				$"refresh-token-{index}",
				FixedExpiresAt,
				TestEmail,
				TestFullName,
				false);

			codes.Add(code);
		}

		// Assert - All codes should be unique
		codes.Count.ShouldBe(100);
	}

	#endregion
}