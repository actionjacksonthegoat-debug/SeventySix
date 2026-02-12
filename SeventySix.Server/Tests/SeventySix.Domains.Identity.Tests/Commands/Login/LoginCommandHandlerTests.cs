// <copyright file="LoginCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Wolverine;

namespace SeventySix.Identity.Tests.Commands.Login;

/// <summary>
/// Unit tests for <see cref="LoginCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical security paths.
/// </remarks>
public class LoginCommandHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly SignInManager<ApplicationUser> SignInManager;
	private readonly AuthenticationService AuthenticationService;
	private readonly IAltchaService AltchaService;
	private readonly ISecurityAuditService SecurityAuditService;
	private readonly IMfaService MfaService;
	private readonly IOptions<MfaSettings> MfaSettings;
	private readonly ITrustedDeviceService TrustedDeviceService;
	private readonly IMessageBus MessageBus;

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
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();
		AltchaService =
			Substitute.For<IAltchaService>();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
		MfaService =
			Substitute.For<IMfaService>();
		MfaSettings =
			Options.Create(
				new MfaSettings
				{
					Enabled = false,
					RequiredForAllUsers = false,
					CodeLength = 6,
					CodeExpirationMinutes = 5,
					MaxAttempts = 5,
					ResendCooldownSeconds = 60
				});
		TrustedDeviceService =
			Substitute.For<ITrustedDeviceService>();
		MessageBus =
			Substitute.For<IMessageBus>();

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

		IdentityMockFactory.ConfigureUserManagerForSuccess(UserManager, user);
		IdentityMockFactory.ConfigureSignInManagerForSuccess(SignInManager);
		IdentityMockFactory.ConfigureAuthServiceForSuccess(AuthenticationService, user);

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaService,
				MfaSettings,
				TrustedDeviceService,
				MessageBus,
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

		IdentityMockFactory.ConfigureUserManagerForSuccess(UserManager, user);
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
				MfaService,
				MfaSettings,
				TrustedDeviceService,
				MessageBus,
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

		IdentityMockFactory.ConfigureUserManagerForSuccess(UserManager, user);
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
				MfaService,
				MfaSettings,
				TrustedDeviceService,
				MessageBus,
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
				MfaService,
				MfaSettings,
				TrustedDeviceService,
				MessageBus,
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
				MfaService,
				MfaSettings,
				TrustedDeviceService,
				MessageBus,
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
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaService,
				MfaSettings,
				TrustedDeviceService,
				MessageBus,
				CancellationToken.None);

		// Assert — returns generic InvalidCredentials (no enumeration)
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
	}

	/// <summary>
	/// Tests that MFA is required when MFA is enabled globally and user has email-based MFA.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MfaEnabledForAllUsers_ReturnsMfaRequiredAsync()
	{
		// Arrange
		IOptions<MfaSettings> mfaSettings =
			Options.Create(
				new MfaSettings
				{
					Enabled = true,
					RequiredForAllUsers = true,
					CodeLength = 6,
					CodeExpirationMinutes = 5,
					MaxAttempts = 5,
					ResendCooldownSeconds = 60
				});

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

		IdentityMockFactory.ConfigureUserManagerForSuccess(UserManager, user);
		IdentityMockFactory.ConfigureSignInManagerForSuccess(SignInManager);

		string challengeToken = "mfa-challenge-token-123";
		string mfaCode = "123456";
		MfaService
			.CreateChallengeAsync(
				user.Id,
				Arg.Any<string?>(),
				Arg.Any<CancellationToken>())
			.Returns((challengeToken, mfaCode));

		// Act
		AuthResult result =
			await LoginCommandHandler.HandleAsync(
				command,
				UserManager,
				SignInManager,
				AuthenticationService,
				AltchaService,
				SecurityAuditService,
				MfaService,
				mfaSettings,
				TrustedDeviceService,
				MessageBus,
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