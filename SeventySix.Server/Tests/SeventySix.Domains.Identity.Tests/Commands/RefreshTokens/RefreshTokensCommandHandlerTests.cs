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

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

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
				Arg.Any<CancellationToken>())
			.Returns(("new-token", false));

		userManager
			.GetRolesAsync(user)
			.Returns(new List<string>());

		tokenService
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"access-token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		RefreshTokensCommand command =
			new(refreshToken);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
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

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

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
				Arg.Any<CancellationToken>())
			.Returns(("new-token", false));

		userManager
			.GetRolesAsync(user)
			.Returns(new List<string>());

		tokenService
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"access-token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		RefreshTokensCommand command =
			new(refreshToken);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
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

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

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
		string? rotatedToken = null;
		tokenService
			.RotateRefreshTokenAsync(
				reuseRefreshToken,
				Arg.Any<CancellationToken>())
			.Returns((rotatedToken, false));

		RefreshTokensCommand command =
			new(reuseRefreshToken);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
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

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

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
				Arg.Any<CancellationToken>())
			.Returns((newRefreshToken, false));

		userManager
			.GetRolesAsync(user)
			.Returns(new List<string>());

		tokenService
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"new-access-token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		RefreshTokensCommand command =
			new(oldRefreshToken);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.RefreshToken.ShouldBe(newRefreshToken);
		result.AccessToken.ShouldNotBeNullOrWhiteSpace();

		await tokenService.Received(1)
			.RotateRefreshTokenAsync(
				oldRefreshToken,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that token refresh issues an access token via <see cref="ITokenService.IssueAccessToken"/>
	/// without creating a new refresh token via <see cref="ITokenService.GenerateRefreshTokenAsync"/>.
	/// The rotated refresh token from <see cref="ITokenService.RotateRefreshTokenAsync"/> is
	/// used directly — no orphaned tokens are created.
	/// </summary>
	[Fact]
	public async Task HandleAsync_TokenRefresh_DoesNotCreateOrphanedRefreshTokenAsync()
	{
		// Arrange
		string oldRefreshToken = "old-token-for-orphan-test";
		string newRefreshToken = "rotated-token";

		ITokenService tokenService =
			Substitute.For<ITokenService>();
		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

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
				Arg.Any<CancellationToken>())
			.Returns((newRefreshToken, false));

		userManager
			.GetRolesAsync(user)
			.Returns(new List<string>());

		tokenService
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"access-token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		RefreshTokensCommand command =
			new(oldRefreshToken);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert — GenerateRefreshTokenAsync must NOT be called (only RotateRefreshTokenAsync provides the new token)
		await tokenService
			.DidNotReceive()
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>());

		// Verify IssueAccessToken WAS called
		tokenService
			.Received(1)
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>());

		result.Success.ShouldBeTrue();
		result.RefreshToken.ShouldBe(newRefreshToken);
	}
}