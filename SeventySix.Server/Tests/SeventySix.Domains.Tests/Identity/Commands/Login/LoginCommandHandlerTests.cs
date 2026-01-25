// <copyright file="LoginCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.Login;

/// <summary>
/// Unit tests for <see cref="LoginCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical security paths.
/// </remarks>
public class LoginCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly SignInManager<ApplicationUser> SignInManager;
	private readonly AuthenticationService AuthenticationService;
	private readonly IAltchaService AltchaService;
	private readonly ISecurityAuditService SecurityAuditService;

	/// <summary>
	/// Initializes a new instance of the <see cref="LoginCommandHandlerTests"/> class.
	/// </summary>
	public LoginCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		SignInManager =
			CreateSignInManagerMock(UserManager);
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();
		AltchaService =
			Substitute.For<IAltchaService>();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();

		// Default: ALTCHA disabled for most tests
		AltchaService.IsEnabled.Returns(false);
	}

	/// <summary>
	/// Tests successful login with valid credentials.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidCredentials_ReturnsSuccessAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTestUser();
		LoginCommand command =
			CreateLoginCommand("testuser", "ValidPass123!");

		SetupUserManagerForSuccess(user);
		SetupSignInSuccess();
		SetupAuthResultSuccess(user);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.AccessToken.ShouldNotBeNullOrWhiteSpace();
	}

	/// <summary>
	/// Tests login failure with invalid credentials.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InvalidCredentials_ReturnsFailedAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTestUser();
		LoginCommand command =
			CreateLoginCommand("testuser", "WrongPassword!");

		SetupUserManagerForSuccess(user);
		SignInManager
			.CheckPasswordSignInAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>(),
				Arg.Any<bool>())
			.Returns(SignInResult.Failed);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
	}

	/// <summary>
	/// Tests login failure when user is locked out.
	/// </summary>
	[Fact]
	public async Task HandleAsync_LockedOutUser_ReturnsAccountLockedAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTestUser();
		LoginCommand command =
			CreateLoginCommand("testuser", "ValidPass123!");

		SetupUserManagerForSuccess(user);
		SignInManager
			.CheckPasswordSignInAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>(),
				Arg.Any<bool>())
			.Returns(SignInResult.LockedOut);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.AccountLocked);
	}

	/// <summary>
	/// Tests login failure when user does not exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NonExistentUser_ReturnsInvalidCredentialsAsync()
	{
		// Arrange
		LoginCommand command =
			CreateLoginCommand("nonexistent", "Password123!");

		UserManager
			.FindByNameAsync(Arg.Any<string>())
			.Returns((ApplicationUser?)null);
		UserManager
			.FindByEmailAsync(Arg.Any<string>())
			.Returns((ApplicationUser?)null);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
	}

	/// <summary>
	/// Tests login failure when user is inactive.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InactiveUser_ReturnsInvalidCredentialsAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTestUser(isActive: false);
		LoginCommand command =
			CreateLoginCommand("testuser", "ValidPass123!");

		UserManager
			.FindByNameAsync(Arg.Any<string>())
			.Returns(user);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
	}

	private static SignInManager<ApplicationUser> CreateSignInManagerMock(
		UserManager<ApplicationUser> userManager)
	{
		IHttpContextAccessor httpContextAccessor =
			Substitute.For<IHttpContextAccessor>();
		IUserClaimsPrincipalFactory<ApplicationUser> claimsFactory =
			Substitute.For<IUserClaimsPrincipalFactory<ApplicationUser>>();
		IOptions<IdentityOptions> optionsAccessor =
			Substitute.For<IOptions<IdentityOptions>>();
		optionsAccessor.Value.Returns(new IdentityOptions());
		ILogger<SignInManager<ApplicationUser>> logger =
			Substitute.For<ILogger<SignInManager<ApplicationUser>>>();

		SignInManager<ApplicationUser> signInManager =
			Substitute.For<SignInManager<ApplicationUser>>(
				userManager,
				httpContextAccessor,
				claimsFactory,
				optionsAccessor,
				logger,
				null,
				null);

		return signInManager;
	}

	private static ApplicationUser CreateTestUser(bool isActive = true) =>
		new()
		{
			Id = 1,
			UserName = "testuser",
			Email = "test@example.com",
			IsActive = isActive,
			RequiresPasswordChange = false,
		};

	private static LoginCommand CreateLoginCommand(
		string usernameOrEmail,
		string password) =>
		new(
			Request: new LoginRequest(
				UsernameOrEmail: usernameOrEmail,
				Password: password),
			ClientIp: "127.0.0.1");

	private void SetupUserManagerForSuccess(ApplicationUser user)
	{
		UserManager
			.FindByNameAsync(Arg.Any<string>())
			.Returns(user);
	}

	private void SetupSignInSuccess()
	{
		SignInManager
			.CheckPasswordSignInAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>(),
				Arg.Any<bool>())
			.Returns(SignInResult.Success);
	}

	private void SetupAuthResultSuccess(ApplicationUser user)
	{
		AuthenticationService
			.GenerateAuthResultAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>(),
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(
				AuthResult.Succeeded(
					accessToken: "test-access-token",
					refreshToken: "test-refresh-token",
					expiresAt: new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero).UtcDateTime,
					email: user.Email!,
					fullName: user.FullName,
					requiresPasswordChange: false));
	}
}