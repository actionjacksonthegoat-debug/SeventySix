// <copyright file="InitiatePasswordResetCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Wolverine;

namespace SeventySix.Domains.Tests.Identity.Commands.InitiatePasswordReset;

/// <summary>
/// Unit tests for <see cref="InitiatePasswordResetCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on token generation and email enqueuing.
/// Security-critical: Password reset flow must be thoroughly tested.
/// </remarks>
public class InitiatePasswordResetCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IMessageBus MessageBus;
	private readonly ILogger<InitiatePasswordResetCommand> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="InitiatePasswordResetCommandHandlerTests"/> class.
	/// </summary>
	public InitiatePasswordResetCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		MessageBus =
			Substitute.For<IMessageBus>();
		Logger =
			Substitute.For<ILogger<InitiatePasswordResetCommand>>();
	}

	/// <summary>
	/// Tests successful password reset initiation for active user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ActiveUser_EnqueuesPasswordResetEmailAsync()
	{
		// Arrange
		const long UserId = 42;
		const string Email = "user@example.com";
		const string ResetToken = "reset-token-123";

		ApplicationUser user =
			CreateActiveUser(UserId, Email);

		InitiatePasswordResetCommand command =
			new(UserId, IsNewUser: false);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GeneratePasswordResetTokenAsync(user)
			.Returns(ResetToken);

		// Act
		await InitiatePasswordResetCommandHandler.HandleAsync(
			command,
			UserManager,
			MessageBus,
			Logger,
			CancellationToken.None);

		// Assert
		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Is<EnqueueEmailCommand>(
					enqueueCommand => enqueueCommand.RecipientEmail == Email
						&& enqueueCommand.EmailType == EmailType.PasswordReset),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that new user flag sends welcome email instead of reset email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NewUser_EnqueuesWelcomeEmailAsync()
	{
		// Arrange
		const long UserId = 42;
		const string Email = "newuser@example.com";
		const string ResetToken = "welcome-token-123";

		ApplicationUser user =
			CreateActiveUser(UserId, Email);

		InitiatePasswordResetCommand command =
			new(UserId, IsNewUser: true);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GeneratePasswordResetTokenAsync(user)
			.Returns(ResetToken);

		// Act
		await InitiatePasswordResetCommandHandler.HandleAsync(
			command,
			UserManager,
			MessageBus,
			Logger,
			CancellationToken.None);

		// Assert
		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Is<EnqueueEmailCommand>(
					enqueueCommand => enqueueCommand.EmailType == EmailType.Welcome),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that user not found throws InvalidOperationException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		const long UserId = 999;

		InitiatePasswordResetCommand command =
			new(UserId, IsNewUser: false);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns((ApplicationUser?)null);

		// Act & Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(
				async () => await InitiatePasswordResetCommandHandler.HandleAsync(
					command,
					UserManager,
					MessageBus,
					Logger,
					CancellationToken.None));

		exception.Message.ShouldContain(UserId.ToString());
	}

	/// <summary>
	/// Tests that inactive user throws InvalidOperationException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InactiveUser_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		const long UserId = 42;

		ApplicationUser inactiveUser =
			new()
			{
				Id = UserId,
				Email = "inactive@example.com",
				IsActive = false,
			};

		InitiatePasswordResetCommand command =
			new(UserId, IsNewUser: false);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(inactiveUser);

		// Act & Assert
		await Should.ThrowAsync<InvalidOperationException>(
			async () => await InitiatePasswordResetCommandHandler.HandleAsync(
				command,
				UserManager,
				MessageBus,
				Logger,
				CancellationToken.None));
	}

	private static ApplicationUser CreateActiveUser(long userId, string email)
	{
		FakeTimeProvider timeProvider =
			new(TestTimeProviderBuilder.DefaultTime);

		return new UserBuilder(timeProvider)
			.WithId(userId)
			.WithUsername("testuser")
			.WithEmail(email)
			.WithIsActive(true)
			.Build();
	}
}