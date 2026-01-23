// <copyright file="LogoutCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.Logout;

/// <summary>
/// Unit tests for <see cref="LogoutCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and failure scenarios.
/// Security-critical: Token revocation must be verified.
/// </remarks>
public class LogoutCommandHandlerTests
{
	private readonly ITokenService TokenService;

	/// <summary>
	/// Initializes a new instance of the <see cref="LogoutCommandHandlerTests"/> class.
	/// </summary>
	public LogoutCommandHandlerTests()
	{
		TokenService =
			Substitute.For<ITokenService>();
	}

	/// <summary>
	/// Tests successful logout when refresh token is valid.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidToken_RevokesTokenSuccessfullyAsync()
	{
		// Arrange
		const string RefreshToken = "valid-refresh-token";

		LogoutCommand command =
			new(RefreshToken);

		TokenService
			.RevokeRefreshTokenAsync(
				RefreshToken,
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		Result result =
			await LogoutCommandHandler.HandleAsync(
				command,
				TokenService,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();

		await TokenService
			.Received(1)
			.RevokeRefreshTokenAsync(
				RefreshToken,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests failure when refresh token is not found or already revoked.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InvalidToken_ReturnsFailureAsync()
	{
		// Arrange
		const string InvalidToken = "non-existent-token";

		LogoutCommand command =
			new(InvalidToken);

		TokenService
			.RevokeRefreshTokenAsync(
				InvalidToken,
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		Result result =
			await LogoutCommandHandler.HandleAsync(
				command,
				TokenService,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe("Token not found or already revoked");
	}

	/// <summary>
	/// Tests that cancellation token is passed to the token service.
	/// </summary>
	[Fact]
	public async Task HandleAsync_PassesCancellationTokenAsync()
	{
		// Arrange
		const string RefreshToken = "test-token";
		using CancellationTokenSource cancellationTokenSource =
			new();

		LogoutCommand command =
			new(RefreshToken);

		TokenService
			.RevokeRefreshTokenAsync(
				RefreshToken,
				cancellationTokenSource.Token)
			.Returns(true);

		// Act
		await LogoutCommandHandler.HandleAsync(
			command,
			TokenService,
			cancellationTokenSource.Token);

		// Assert
		await TokenService
			.Received(1)
			.RevokeRefreshTokenAsync(
				RefreshToken,
				cancellationTokenSource.Token);
	}
}
