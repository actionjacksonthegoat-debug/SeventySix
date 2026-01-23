// <copyright file="InitiateRegistrationCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Wolverine;

namespace SeventySix.Domains.Tests.Identity.Commands.InitiateRegistration;

/// <summary>
/// Unit tests for <see cref="InitiateRegistrationCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on security-critical scenarios.
/// Email enumeration prevention is critical.
/// </remarks>
public class InitiateRegistrationCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IMessageBus MessageBus;
	private readonly FakeTimeProvider TimeProvider;

	/// <summary>
	/// Initializes a new instance of the <see cref="InitiateRegistrationCommandHandlerTests"/> class.
	/// </summary>
	public InitiateRegistrationCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		MessageBus =
			Substitute.For<IMessageBus>();
		TimeProvider =
			new FakeTimeProvider(DateTimeOffset.UtcNow);
	}

	/// <summary>
	/// Tests silent return when email already exists to prevent enumeration.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExistingEmail_SilentlyReturnsAsync()
	{
		// Arrange
		const string Email = "existing@example.com";

		InitiateRegistrationRequest request =
			new(Email);

		ApplicationUser existingUser =
			new() { Email = Email };

		UserManager
			.FindByEmailAsync(Email)
			.Returns(existingUser);

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert - No user creation or email should occur
		await UserManager
			.DidNotReceive()
			.CreateAsync(Arg.Any<ApplicationUser>());

		await MessageBus
			.DidNotReceive()
			.InvokeAsync(
				Arg.Any<EnqueueEmailCommand>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests successful registration initiation for new email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NewEmail_CreatesUserAndEnqueuesEmailAsync()
	{
		// Arrange
		const string Email = "newuser@example.com";
		const string VerificationToken = "verification-token-123";

		InitiateRegistrationRequest request =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns((ApplicationUser?)null);

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		UserManager
			.GenerateEmailConfirmationTokenAsync(Arg.Any<ApplicationUser>())
			.Returns(VerificationToken);

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert
		await UserManager
			.Received(1)
			.CreateAsync(Arg.Is<ApplicationUser>(
				user => user.Email == Email && !user.EmailConfirmed));

		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Is<EnqueueEmailCommand>(
					command => command.RecipientEmail == Email
						&& command.EmailType == EmailType.Verification),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that create failure silently returns without sending email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_CreateFails_SilentlyReturnsAsync()
	{
		// Arrange
		const string Email = "test@example.com";

		InitiateRegistrationRequest request =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns((ApplicationUser?)null);

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(
				new IdentityError { Description = "Create failed" }));

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert - No email should be enqueued on failure
		await MessageBus
			.DidNotReceive()
			.InvokeAsync(
				Arg.Any<EnqueueEmailCommand>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that created user has correct initial state.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NewEmail_CreatesUserWithCorrectStateAsync()
	{
		// Arrange
		const string Email = "newuser@example.com";
		ApplicationUser? capturedUser =
			null;

		InitiateRegistrationRequest request =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns((ApplicationUser?)null);

		UserManager
			.CreateAsync(Arg.Do<ApplicationUser>(
				user => capturedUser = user))
			.Returns(IdentityResult.Success);

		UserManager
			.GenerateEmailConfirmationTokenAsync(Arg.Any<ApplicationUser>())
			.Returns("token");

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert
		capturedUser.ShouldNotBeNull();
		capturedUser.Email.ShouldBe(Email);
		capturedUser.UserName.ShouldBe(Email); // Temporary username
		capturedUser.IsActive.ShouldBeFalse();
		capturedUser.EmailConfirmed.ShouldBeFalse();
	}
}
