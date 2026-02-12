using System;
using System.Threading;
using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Xunit;

namespace SeventySix.Identity.Tests.Commands.RefreshTokens;

/// <summary>
/// Unit tests for <see cref="RefreshTokensCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on token rotation and password change scenarios.
/// </remarks>
public class RefreshTokensCommandHandlerTests
{
	private readonly ISecurityAuditService SecurityAuditService;

	/// <summary>
	/// Initializes a new instance of the <see cref="RefreshTokensCommandHandlerTests"/> class.
	/// </summary>
	public RefreshTokensCommandHandlerTests()
	{
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
	}

	/// <summary>
	/// Tests that a user who has changed their password gets RequiresPasswordChange = false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_WhenUserHasChangedPassword_ReturnsFalseForRequiresPasswordChangeAsync()
	{
		// Arrange
		string refreshToken = "old-refresh";
		string clientIpAddress = "127.0.0.1";

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		AuthenticationService authenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		ApplicationUser user =
			new()
			{
				Id = 200,
				UserName = "oauthuser",
				Email = "oauth@example.com",
				IsActive = true,
				RequiresPasswordChange = false
			};

		tokenService
			.ValidateRefreshTokenAsync(
				refreshToken,
				Arg.Any<CancellationToken>())
			.Returns(user.Id);

		userManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		tokenService
			.RotateRefreshTokenAsync(
				refreshToken,
				clientIpAddress,
				Arg.Any<CancellationToken>())
			.Returns("new-token");

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		AuthResult expectedAuthResult =
			AuthResult.Succeeded(
				"access-token",
				"new-token",
				now.AddMinutes(15),
				user.Email,
				null,
				false);

		authenticationService
			.GenerateAuthResultAsync(
				user,
				clientIpAddress,
				user.RequiresPasswordChange,
				false,
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAuthResult));

		RefreshTokensCommand command =
			new(refreshToken, clientIpAddress);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				authenticationService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.RequiresPasswordChange.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that a user who requires password change gets RequiresPasswordChange = true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_WhenUserRequiresPasswordChange_ReturnsTrueAsync()
	{
		// Arrange
		string refreshToken = "old-refresh";
		string clientIpAddress = "127.0.0.1";

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		AuthenticationService authenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		ApplicationUser user =
			new()
			{
				Id = 201,
				UserName = "legacyuser",
				Email = "legacy@example.com",
				IsActive = true,
				RequiresPasswordChange = true,
			};

		tokenService
			.ValidateRefreshTokenAsync(
				refreshToken,
				Arg.Any<CancellationToken>())
			.Returns(user.Id);

		userManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		tokenService
			.RotateRefreshTokenAsync(
				refreshToken,
				clientIpAddress,
				Arg.Any<CancellationToken>())
			.Returns("new-token");

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		AuthResult expectedAuthResult =
			AuthResult.Succeeded(
				"access-token",
				"new-token",
				now.AddMinutes(15),
				user.Email,
				null,
				true);

		authenticationService
			.GenerateAuthResultAsync(
				user,
				clientIpAddress,
				user.RequiresPasswordChange,
				false,
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAuthResult));

		RefreshTokensCommand command =
			new(refreshToken, clientIpAddress);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				authenticationService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.RequiresPasswordChange.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that token reuse returns TokenReuse error code (replay attack detection).
	/// </summary>
	[Fact]
	public async Task HandleAsync_TokenReuseDetected_ReturnsTokenReuseErrorAsync()
	{
		// Arrange
		string reuseRefreshToken = "reused-refresh-token";
		string clientIpAddress = "127.0.0.1";

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		AuthenticationService authenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		ApplicationUser user =
			new()
			{
				Id = 300,
				UserName = "victimuser",
				Email = "victim@example.com",
				IsActive = true,
				RequiresPasswordChange = false
			};

		tokenService
			.ValidateRefreshTokenAsync(
				reuseRefreshToken,
				Arg.Any<CancellationToken>())
			.Returns(user.Id);

		userManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		// Token rotation returns null → reuse detected
		tokenService
			.RotateRefreshTokenAsync(
				reuseRefreshToken,
				clientIpAddress,
				Arg.Any<CancellationToken>())
			.Returns((string?)null);

		RefreshTokensCommand command =
			new(reuseRefreshToken, clientIpAddress);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				authenticationService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.TokenReuse);
	}

	/// <summary>
	/// Tests the happy path: valid refresh token is rotated and new tokens are returned.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRefreshToken_RotatesAndReturnsNewTokensAsync()
	{
		// Arrange
		string oldRefreshToken = "old-refresh-token";
		string newRefreshToken = "new-rotated-token";
		string clientIpAddress = "127.0.0.1";

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		AuthenticationService authenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		ApplicationUser user =
			new()
			{
				Id = 400,
				UserName = "happyuser",
				Email = "happy@example.com",
				IsActive = true,
				RequiresPasswordChange = false
			};

		tokenService
			.ValidateRefreshTokenAsync(
				oldRefreshToken,
				Arg.Any<CancellationToken>())
			.Returns(user.Id);

		userManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		tokenService
			.RotateRefreshTokenAsync(
				oldRefreshToken,
				clientIpAddress,
				Arg.Any<CancellationToken>())
			.Returns(newRefreshToken);

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		AuthResult expectedAuthResult =
			AuthResult.Succeeded(
				"new-access-token",
				"placeholder-refresh",
				now.AddMinutes(15),
				user.Email,
				null,
				false);

		authenticationService
			.GenerateAuthResultAsync(
				user,
				clientIpAddress,
				false,
				false,
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAuthResult));

		RefreshTokensCommand command =
			new(oldRefreshToken, clientIpAddress);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				authenticationService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.RefreshToken.ShouldBe(newRefreshToken);
		result.AccessToken.ShouldNotBeNullOrWhiteSpace();

		await tokenService.Received(1)
			.RotateRefreshTokenAsync(
				oldRefreshToken,
				clientIpAddress,
				Arg.Any<CancellationToken>());
	}
}