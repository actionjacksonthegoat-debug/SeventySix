using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.RefreshTokens;

/// <summary>
/// Unit tests for <see cref="RefreshTokensCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on token rotation and password change scenarios.
/// </remarks>
public sealed class RefreshTokensCommandHandlerTests
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
			.Returns(("new-token", false));

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		AuthResult expectedAccessTokenResult =
			AuthResult.Succeeded(
				"access-token",
				string.Empty,
				now.AddMinutes(15),
				user.Email,
				null,
				false);

		authenticationService
			.GenerateAccessTokenResultAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAccessTokenResult));

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
			.Returns(("new-token", false));

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		AuthResult expectedAccessTokenResult =
			AuthResult.Succeeded(
				"access-token",
				string.Empty,
				now.AddMinutes(15),
				user.Email,
				null,
				true);

		authenticationService
			.GenerateAccessTokenResultAsync(
				user,
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAccessTokenResult));

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
			.Returns(((string?)null, false));

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
			.Returns((newRefreshToken, false));

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		AuthResult expectedAccessTokenResult =
			AuthResult.Succeeded(
				"new-access-token",
				string.Empty,
				now.AddMinutes(15),
				user.Email,
				null,
				false);

		authenticationService
			.GenerateAccessTokenResultAsync(
				user,
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAccessTokenResult));

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

	/// <summary>
	/// Proves the orphaned token bug: GenerateAuthResultAsync creates an unnecessary
	/// refresh token that is immediately discarded in favor of the rotated one.
	/// After the fix, this test verifies that only GenerateAccessTokenResultAsync is called
	/// (no orphaned refresh token created).
	/// </summary>
	[Fact]
	public async Task HandleAsync_TokenRefresh_DoesNotCreateOrphanedRefreshTokenAsync()
	{
		// Arrange
		string oldRefreshToken = "old-token-for-orphan-test";
		string newRefreshToken = "rotated-token";
		string clientIpAddress = "10.0.0.1";

		ITokenService tokenService =
			Substitute.For<ITokenService>();
		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();
		AuthenticationService authenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		ApplicationUser user =
			new()
			{
				Id = 500,
				UserName = "orphanuser",
				Email = "orphan@example.com",
				IsActive = true,
				RequiresPasswordChange = false,
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
			.Returns((newRefreshToken, false));

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		AuthResult expectedAccessTokenResult =
			AuthResult.Succeeded(
				"access-token",
				string.Empty,
				now.AddMinutes(15),
				user.Email,
				null);

		authenticationService
			.GenerateAccessTokenResultAsync(
				user,
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAccessTokenResult));

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

		// Assert — GenerateAuthResultAsync should NOT be called (it creates orphaned tokens)
		await authenticationService
			.DidNotReceive()
			.GenerateAuthResultAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>());

		// Verify GenerateAccessTokenResultAsync WAS called (access-token-only path)
		await authenticationService
			.Received(1)
			.GenerateAccessTokenResultAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>());

		result.Success.ShouldBeTrue();
		result.RefreshToken.ShouldBe(newRefreshToken);
	}
}