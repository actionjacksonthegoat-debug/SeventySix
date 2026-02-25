// <copyright file="LoginCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.Login;

/// <summary>
/// Unit tests for <see cref="LoginCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical security paths.
/// </remarks>
public sealed class LoginCommandHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly SignInManager<ApplicationUser> SignInManager;
	private readonly IAuthRepository AuthRepository;
	private readonly AuthenticationService AuthenticationService;
	private readonly IAltchaService AltchaService;
	private readonly ISecurityAuditService SecurityAuditService;
	private readonly IMfaOrchestrator MfaOrchestrator;

	/// <summary>
	/// Initializes a new instance of the <see cref="LoginCommandHandlerTests"/> class.
	/// </summary>
	public LoginCommandHandlerTests()
	{
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		SignInManager =
			IdentityMockFactory.CreateSignInManager(UserManager);
		AuthRepository =
			Substitute.For<IAuthRepository>();
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();
		AltchaService =
			Substitute.For<IAltchaService>();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
		MfaOrchestrator =
			Substitute.For<IMfaOrchestrator>();
		MfaOrchestrator
			.IsMfaRequired(Arg.Any<ApplicationUser>())
			.Returns(false);

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
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithRequiresPasswordChange(false)
				.Build();
		LoginCommand command =
			CreateLoginCommand(
				"testuser",
				"ValidPass123!");

		AuthRepository
			.FindByUsernameOrEmailAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(user);
		IdentityMockFactory.ConfigureSignInManagerForSuccess(SignInManager);
		IdentityMockFactory.ConfigureAuthServiceForSuccess(AuthenticationService, user);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
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
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithRequiresPasswordChange(false)
				.Build();
		LoginCommand command =
			CreateLoginCommand(
				"testuser",
				"WrongPassword!");

		AuthRepository
			.FindByUsernameOrEmailAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(user);
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
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
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
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithRequiresPasswordChange(false)
				.Build();
		LoginCommand command =
			CreateLoginCommand(
				"testuser",
				"ValidPass123!");

		AuthRepository
			.FindByUsernameOrEmailAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(user);
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
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
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
			CreateLoginCommand(
				"nonexistent",
				"Password123!");

		AuthRepository
			.FindByUsernameOrEmailAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(default(ApplicationUser?));

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
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
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithIsActive(false)
				.WithRequiresPasswordChange(false)
				.Build();
		LoginCommand command =
			CreateLoginCommand(
				"testuser",
				"ValidPass123!");

		AuthRepository
			.FindByUsernameOrEmailAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(user);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
	}

	/// <summary>
	/// Tests login failure when ALTCHA is enabled and validation fails.
	/// </summary>
	[Fact]
	public async Task HandleAsync_AltchaEnabledAndValidationFails_ReturnsInvalidCredentialsAsync()
	{
		// Arrange
		AltchaService.IsEnabled.Returns(true);
		AltchaService
			.ValidateAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(new AltchaValidationResult
			{
				Success = false,
				ErrorCode = "INVALID_PAYLOAD"
			});

		LoginCommand command =
			CreateLoginCommand(
				"testuser",
				"ValidPass123!");

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
				CancellationToken.None);

		// Assert — returns generic InvalidCredentials (no enumeration)
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
	}

	/// <summary>
	/// When RequiredForAllUsers is false and user has not enrolled in MFA,
	/// the login succeeds without any MFA challenge — IMfaOrchestrator returns false for IsMfaRequired.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RequiredForAllUsersFalse_UserWithoutMfa_SkipsMfaChallengeAsync()
	{
		// Arrange — orchestrator default (IsMfaRequired returns false)
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(20)
				.WithUsername("newuser")
				.WithEmail("newuser@example.com")
				.WithRequiresPasswordChange(false)
				.WithMfaEnabled(false)
				.Build();

		LoginCommand command =
			CreateLoginCommand(
				"newuser",
				"ValidPass123!");

		AuthRepository
			.FindByUsernameOrEmailAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(user);
		IdentityMockFactory.ConfigureSignInManagerForSuccess(SignInManager);
		IdentityMockFactory.ConfigureAuthServiceForSuccess(AuthenticationService, user);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
				CancellationToken.None);

		// Assert — MFA is skipped because IsMfaRequired returns false
		result.Success.ShouldBeTrue();
		result.RequiresMfa.ShouldBeFalse();

		// Orchestrator InitiateChallengeAsync should never be called
		await MfaOrchestrator
			.DidNotReceive()
			.InitiateChallengeAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string?>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that MFA is required when IMfaOrchestrator.IsMfaRequired returns true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MfaEnabledForAllUsers_ReturnsMfaRequiredAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(10)
				.WithUsername("mfauser")
				.WithEmail("mfa@example.com")
				.WithRequiresPasswordChange(false)
				.Build();

		LoginCommand command =
			CreateLoginCommand(
				"mfauser",
				"ValidPass123!");

		AuthRepository
			.FindByUsernameOrEmailAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(user);
		IdentityMockFactory.ConfigureSignInManagerForSuccess(SignInManager);

		string challengeToken = "mfa-challenge-token-123";
		MfaOrchestrator
			.IsMfaRequired(Arg.Any<ApplicationUser>())
			.Returns(true);
		MfaOrchestrator
			.TryBypassViaTrustedDeviceAsync(
				Arg.Any<LoginCommand>(),
				Arg.Any<ApplicationUser>(),
				Arg.Any<CancellationToken>())
			.Returns(default(AuthResult?));
		MfaOrchestrator
			.InitiateChallengeAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string?>(),
				Arg.Any<CancellationToken>())
			.Returns(
				AuthResult.MfaRequired(
					challengeToken,
					"mfa@example.com",
					MfaMethod.Email,
					[MfaMethod.Email]));

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				SignInManager,
				AuthRepository,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaOrchestrator,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.RequiresMfa.ShouldBeTrue();
		result.MfaChallengeToken.ShouldBe(challengeToken);
		result.MfaMethod.ShouldBe(MfaMethod.Email);
	}

	private static LoginCommand CreateLoginCommand(
		string usernameOrEmail,
		string password) =>
		new(
			Request: new LoginRequest(
				UsernameOrEmail: usernameOrEmail,
				Password: password),
			ClientIp: "127.0.0.1");
}