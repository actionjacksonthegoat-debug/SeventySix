// <copyright file="TokenRevocationServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.Builders;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="TokenRevocationService"/>.
/// Tests token revocation for individual tokens and user-wide revocation.
/// </summary>
public sealed class TokenRevocationServiceUnitTests
{
	/// <summary>
	/// Fixed time for deterministic tests.
	/// </summary>
	private static DateTimeOffset FixedTime =>
		TestTimeProviderBuilder.DefaultTime;

	private readonly ITokenRepository TokenRepository;
	private readonly FakeTimeProvider TimeProvider;
	private readonly TokenRevocationService Service;

	public TokenRevocationServiceUnitTests()
	{
		TokenRepository =
			Substitute.For<ITokenRepository>();
		TimeProvider =
			new FakeTimeProvider(FixedTime);

		Service =
			new TokenRevocationService(
			TokenRepository,
			TimeProvider);
	}

	/// <summary>
	/// Verifies that revoking a valid token marks it as revoked.
	/// </summary>
	[Fact]
	public async Task RevokeRefreshTokenAsync_ValidToken_MarksRevokedAsync()
	{
		// Arrange
		string plainTextToken = "test-token-value";
		string expectedHash =
			CryptoExtensions.ComputeSha256Hash(plainTextToken);

		TokenRepository
			.RevokeByHashAsync(
				expectedHash,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		bool result =
			await Service.RevokeRefreshTokenAsync(
			plainTextToken,
			CancellationToken.None);

		// Assert
		result.ShouldBeTrue();

		await TokenRepository
			.Received(1)
			.RevokeByHashAsync(
				expectedHash,
				FixedTime,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that revoking a nonexistent token returns false.
	/// </summary>
	[Fact]
	public async Task RevokeRefreshTokenAsync_NonexistentToken_ReturnsFalseAsync()
	{
		// Arrange
		TokenRepository
			.RevokeByHashAsync(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		bool result =
			await Service.RevokeRefreshTokenAsync(
			"nonexistent",
			CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Verifies that revoking all user tokens delegates to the repository.
	/// </summary>
	[Fact]
	public async Task RevokeAllUserTokensAsync_RevokesAllAndReturnsCountAsync()
	{
		// Arrange
		TokenRepository
			.RevokeAllUserTokensAsync(
				1L,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(5);

		// Act
		int count =
			await Service.RevokeAllUserTokensAsync(
			userId: 1L,
			CancellationToken.None);

		// Assert
		count.ShouldBe(5);

		await TokenRepository
			.Received(1)
			.RevokeAllUserTokensAsync(
				1L,
				FixedTime,
				Arg.Any<CancellationToken>());
	}
}