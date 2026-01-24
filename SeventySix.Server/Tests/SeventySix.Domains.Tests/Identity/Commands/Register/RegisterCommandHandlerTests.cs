// <copyright file="RegisterCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.Register;

/// <summary>
/// Unit tests for <see cref="RegisterCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical validation paths.
/// </remarks>
public class RegisterCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly AuthenticationService AuthenticationService;
	private readonly IAltchaService AltchaService;
	private readonly TimeProvider TimeProvider;
	private readonly ILogger<RegisterCommand> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="RegisterCommandHandlerTests"/> class.
	/// </summary>
	public RegisterCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();
		AltchaService =
			Substitute.For<IAltchaService>();
		TimeProvider =
			Substitute.For<TimeProvider>();
		Logger =
			Substitute.For<ILogger<RegisterCommand>>();

		// Default: ALTCHA disabled for most tests
		AltchaService.IsEnabled.Returns(false);

		// Setup default time
		TimeProvider
			.GetUtcNow()
			.Returns(TestTimeProviderBuilder.DefaultTime);
	}

	/// <summary>
	/// Tests successful registration with valid data.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_ReturnsSuccessAsync()
	{
		// Arrange
		RegisterCommand command =
			CreateRegisterCommand();

		SetupUserManagerForSuccess();
		SetupAuthResultSuccess();

		// Act
		AuthResult result =
			await RegisterCommandHandler.HandleAsync(
				command,
				UserManager,
				AuthenticationService,
				AltchaService,
				TimeProvider,
				Logger,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.AccessToken.ShouldNotBeNullOrWhiteSpace();
	}

	/// <summary>
	/// Tests that user is assigned to User role after registration.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_AssignsUserRoleAsync()
	{
		// Arrange
		RegisterCommand command =
			CreateRegisterCommand();

		SetupUserManagerForSuccess();
		SetupAuthResultSuccess();

		// Act
		await RegisterCommandHandler.HandleAsync(
			command,
			UserManager,
			AuthenticationService,
			AltchaService,
			TimeProvider,
			Logger,
			CancellationToken.None);

		// Assert
		await UserManager
			.Received(1)
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				RoleConstants.User);
	}

	/// <summary>
	/// Tests registration failure when UserManager returns errors.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserManagerFails_ReturnsFailedAsync()
	{
		// Arrange
		RegisterCommand command =
			CreateRegisterCommand();

		UserManager
			.CreateAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "DuplicateUserName",
						Description = "Username already exists",
					}));

		// Act
		AuthResult result =
			await RegisterCommandHandler.HandleAsync(
				command,
				UserManager,
				AuthenticationService,
				AltchaService,
				TimeProvider,
				Logger,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe("REGISTRATION_FAILED");
		result.Error!.ShouldContain("Username already exists");
	}

	/// <summary>
	/// Tests registration failure with invalid ALTCHA when enabled.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InvalidAltcha_ReturnsFailedAsync()
	{
		// Arrange
		RegisterCommand command =
			CreateRegisterCommand();

		AltchaService.IsEnabled.Returns(true);
		AltchaService
			.ValidateAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(
				AltchaValidationResult.Failed(AltchaErrorCodes.ValidationFailed));

		// Act
		AuthResult result =
			await RegisterCommandHandler.HandleAsync(
				command,
				UserManager,
				AuthenticationService,
				AltchaService,
				TimeProvider,
				Logger,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe("REGISTRATION_FAILED");
	}

	private static RegisterCommand CreateRegisterCommand() =>
		new(
			Request: new RegisterRequest(
				Username: "newuser",
				Email: "newuser@example.com",
				Password: "ValidPass123!",
				FullName: "New User"),
			ClientIp: "127.0.0.1");

	private void SetupUserManagerForSuccess()
	{
		UserManager
			.CreateAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);
	}

	private void SetupAuthResultSuccess()
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
					email: "newuser@example.com",
					fullName: "New User",
					requiresPasswordChange: false));
	}
}