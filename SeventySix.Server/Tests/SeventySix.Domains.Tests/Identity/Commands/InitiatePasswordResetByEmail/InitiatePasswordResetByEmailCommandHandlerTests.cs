// <copyright file="InitiatePasswordResetByEmailCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using Wolverine;

namespace SeventySix.Domains.Tests.Identity.Commands.InitiatePasswordResetByEmail;

/// <summary>
/// Unit tests for <see cref="InitiatePasswordResetByEmailCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on security-critical scenarios.
/// Email enumeration prevention and reCAPTCHA validation are critical.
/// </remarks>
public class InitiatePasswordResetByEmailCommandHandlerTests
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	private readonly IRecaptchaService RecaptchaService;
	private readonly IMessageBus MessageBus;

	/// <summary>
	/// Initializes a new instance of the <see cref="InitiatePasswordResetByEmailCommandHandlerTests"/> class.
	/// </summary>
	public InitiatePasswordResetByEmailCommandHandlerTests()
	{
		RecaptchaService =
			Substitute.For<IRecaptchaService>();
		MessageBus =
			Substitute.For<IMessageBus>();
	}

	/// <summary>
	/// Tests that failed reCAPTCHA validation silently returns.
	/// </summary>
	[Fact]
	public async Task HandleAsync_FailedRecaptcha_SilentlyReturnsAsync()
	{
		// Arrange
		const string Email = "user@example.com";
		const string RecaptchaToken = "invalid-token";

		ForgotPasswordRequest request =
			new(Email, RecaptchaToken);

		InitiatePasswordResetByEmailCommand command =
			new(request);

		RecaptchaService.IsEnabled.Returns(true);
		RecaptchaService
			.ValidateAsync(
				RecaptchaToken,
				RecaptchaActionConstants.PasswordReset,
				Arg.Any<CancellationToken>())
			.Returns(RecaptchaValidationResult.Failed(["invalid-token"]));

		// Act
		await InitiatePasswordResetByEmailCommandHandler.HandleAsync(
			command,
			RecaptchaService,
			MessageBus,
			CancellationToken.None);

		// Assert - No query should be made
		await MessageBus
			.DidNotReceive()
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByEmailQuery>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that user not found silently returns.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_SilentlyReturnsAsync()
	{
		// Arrange
		const string Email = "nonexistent@example.com";

		ForgotPasswordRequest request =
			new(Email);

		InitiatePasswordResetByEmailCommand command =
			new(request);

		RecaptchaService.IsEnabled.Returns(false);

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Is<GetUserByEmailQuery>(query => query.Email == Email),
				Arg.Any<CancellationToken>())
			.Returns((UserDto?)null);

		// Act
		await InitiatePasswordResetByEmailCommandHandler.HandleAsync(
			command,
			RecaptchaService,
			MessageBus,
			CancellationToken.None);

		// Assert - No reset should be initiated
		await MessageBus
			.DidNotReceive()
			.InvokeAsync(
				Arg.Any<InitiatePasswordResetCommand>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that inactive user silently returns.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InactiveUser_SilentlyReturnsAsync()
	{
		// Arrange
		const string Email = "inactive@example.com";

		UserDto inactiveUser =
			CreateUserDto(
				userId: 42,
				username: "inactive",
				email: Email,
				isActive: false);

		ForgotPasswordRequest request =
			new(Email);

		InitiatePasswordResetByEmailCommand command =
			new(request);

		RecaptchaService.IsEnabled.Returns(false);

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Is<GetUserByEmailQuery>(query => query.Email == Email),
				Arg.Any<CancellationToken>())
			.Returns(inactiveUser);

		// Act
		await InitiatePasswordResetByEmailCommandHandler.HandleAsync(
			command,
			RecaptchaService,
			MessageBus,
			CancellationToken.None);

		// Assert - No reset should be initiated for inactive user
		await MessageBus
			.DidNotReceive()
			.InvokeAsync(
				Arg.Any<InitiatePasswordResetCommand>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests successful password reset initiation for active user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ActiveUser_InitiatesPasswordResetAsync()
	{
		// Arrange
		const long UserId = 42;
		const string Email = "active@example.com";

		UserDto activeUser =
			CreateUserDto(
				userId: UserId,
				username: "activeuser",
				email: Email,
				isActive: true);

		ForgotPasswordRequest request =
			new(Email);

		InitiatePasswordResetByEmailCommand command =
			new(request);

		RecaptchaService.IsEnabled.Returns(false);

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Is<GetUserByEmailQuery>(query => query.Email == Email),
				Arg.Any<CancellationToken>())
			.Returns(activeUser);

		// Act
		await InitiatePasswordResetByEmailCommandHandler.HandleAsync(
			command,
			RecaptchaService,
			MessageBus,
			CancellationToken.None);

		// Assert
		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Is<InitiatePasswordResetCommand>(
					resetCommand => resetCommand.UserId == UserId
						&& !resetCommand.IsNewUser),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that reCAPTCHA is skipped when disabled.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RecaptchaDisabled_SkipsValidationAsync()
	{
		// Arrange
		const string Email = "user@example.com";

		ForgotPasswordRequest request =
			new(Email, "any-token");

		InitiatePasswordResetByEmailCommand command =
			new(request);

		RecaptchaService.IsEnabled.Returns(false);

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByEmailQuery>(),
				Arg.Any<CancellationToken>())
			.Returns((UserDto?)null);

		// Act
		await InitiatePasswordResetByEmailCommandHandler.HandleAsync(
			command,
			RecaptchaService,
			MessageBus,
			CancellationToken.None);

		// Assert - reCAPTCHA validation should not be called
		await RecaptchaService
			.DidNotReceive()
			.ValidateAsync(
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	private static UserDto CreateUserDto(
		long userId,
		string username,
		string email,
		bool isActive)
	{
		return new UserDto(
			Id: userId,
			Username: username,
			Email: email,
			FullName: null,
			CreateDate: TimeProvider.GetUtcNow().UtcDateTime,
			IsActive: isActive,
			CreatedBy: "system",
			ModifyDate: null,
			ModifiedBy: string.Empty,
			LastLoginAt: null,
			IsDeleted: false,
			DeletedAt: null,
			DeletedBy: null);
	}
}
