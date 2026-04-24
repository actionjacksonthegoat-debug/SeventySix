// <copyright file="SessionManagementServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="SessionManagementService"/>.
/// Tests session limit enforcement logic.
/// </summary>
public sealed class SessionManagementServiceUnitTests
{
	/// <summary>
	/// Fixed time for deterministic tests.
	/// </summary>
	private static DateTimeOffset FixedTime =>
		TestTimeProviderBuilder.DefaultTime;

	private readonly ITokenRepository TokenRepository;
	private readonly IOptions<AuthSettings> AuthOptions;
	private readonly SessionManagementService Service;

	public SessionManagementServiceUnitTests()
	{
		TokenRepository =
			Substitute.For<ITokenRepository>();
		AuthOptions =
			Options.Create(
			new AuthSettings
			{
				Token =
					new TokenSettings { MaxActiveSessionsPerUser = 3 },
			});

		Service =
			new SessionManagementService(
			TokenRepository,
			AuthOptions);
	}

	/// <summary>
	/// Verifies that when the session limit is exceeded, the oldest token is revoked.
	/// </summary>
	[Fact]
	public async Task EnforceSessionLimitAsync_ExceedsLimit_RevokesOldestAsync()
	{
		// Arrange
		TokenRepository
			.GetActiveSessionCountAsync(
				1L,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(3);

		// Act
		await Service.EnforceSessionLimitAsync(
			userId: 1L,
			now: FixedTime,
			cancellationToken: CancellationToken.None);

		// Assert
		await TokenRepository
			.Received(1)
			.RevokeOldestActiveTokenAsync(
				1L,
				FixedTime,
				FixedTime,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that no revocation occurs when under the session limit.
	/// </summary>
	[Fact]
	public async Task EnforceSessionLimitAsync_UnderLimit_DoesNotRevokeAsync()
	{
		// Arrange
		TokenRepository
			.GetActiveSessionCountAsync(
				1L,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(2);

		// Act
		await Service.EnforceSessionLimitAsync(
			userId: 1L,
			now: FixedTime,
			cancellationToken: CancellationToken.None);

		// Assert
		await TokenRepository
			.DidNotReceive()
			.RevokeOldestActiveTokenAsync(
				Arg.Any<long>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());
	}
}