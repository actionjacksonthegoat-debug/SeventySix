// <copyright file="CreateUserCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared.Contracts.Emails;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Wolverine;

namespace SeventySix.Identity.Tests.Commands.CreateUser;

/// <summary>
/// Unit tests for <see cref="CreateUserCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical error handling.
/// </remarks>
public class CreateUserCommandHandlerTests
{
	private readonly IMessageBus MessageBus;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IIdentityCacheService IdentityCache;
	private readonly FakeTimeProvider TimeProvider;
	private readonly ILogger Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="CreateUserCommandHandlerTests"/> class.
	/// </summary>
	public CreateUserCommandHandlerTests()
	{
		MessageBus =
			Substitute.For<IMessageBus>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		IdentityCache =
			Substitute.For<IIdentityCacheService>();
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
		Logger =
			Substitute.For<ILogger>();
	}

	/// <summary>
	/// Tests successful user creation with welcome email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_CreatesUserAndEnqueuesEmailAsync()
	{
		// Arrange
		const string Username = "newuser";
		const string Email = "new@example.com";
		const string FullName = "New User";
		const string ResetToken = "reset-token-123";

		CreateUserRequest request =
			new()
			{
				Username = Username,
				Email = Email,
				FullName = FullName,
				IsActive = true,
				CreatedBy = "admin",
			};

		ApplicationUser? capturedUser =
			null;

		UserManager
			.CreateAsync(Arg.Do<ApplicationUser>(
				user =>
				{
					user.Id = 42;
					capturedUser = user;
				}))
			.Returns(IdentityResult.Success);

		UserManager
			.GeneratePasswordResetTokenAsync(Arg.Any<ApplicationUser>())
			.Returns(ResetToken);

		// Act
		UserDto result =
			await CreateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				TimeProvider,
				Logger,
				CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Username.ShouldBe(Username);
		result.Email.ShouldBe(Email);

		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Is<EnqueueEmailCommand>(
					command => command.EmailType == EmailTypeConstants.Welcome
						&& command.RecipientEmail == Email),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that duplicate username throws DuplicateUserException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DuplicateUsername_ThrowsDuplicateUserExceptionAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "existinguser",
				Email = "new@example.com",
				FullName = "Test User",
			};

		IdentityError duplicateError =
			new() { Code = "DuplicateUserName", Description = "Username already exists" };

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(duplicateError));

		// Act & Assert
		await Should.ThrowAsync<DuplicateUserException>(
			async () => await CreateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				TimeProvider,
				Logger,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that duplicate email throws DuplicateUserException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DuplicateEmail_ThrowsDuplicateUserExceptionAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "newuser",
				Email = "existing@example.com",
				FullName = "Test User",
			};

		IdentityError duplicateError =
			new() { Code = "DuplicateEmail", Description = "Email already exists" };

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(duplicateError));

		// Act & Assert
		await Should.ThrowAsync<DuplicateUserException>(
			async () => await CreateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				TimeProvider,
				Logger,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that non-duplicate errors throw InvalidOperationException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NonDuplicateError_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "newuser",
				Email = "new@example.com",
				FullName = "Test User",
			};

		IdentityError genericError =
			new() { Code = "PasswordTooShort", Description = "Some other error" };

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(genericError));

		// Act & Assert
		await Should.ThrowAsync<InvalidOperationException>(
			async () => await CreateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				TimeProvider,
				Logger,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that email failure does not prevent user creation.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmailEnqueueFails_StillReturnsUserAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "newuser",
				Email = "new@example.com",
				FullName = "Test User",
			};

		UserManager
			.CreateAsync(Arg.Do<ApplicationUser>(
				user => user.Id = 42))
			.Returns(IdentityResult.Success);

		UserManager
			.GeneratePasswordResetTokenAsync(Arg.Any<ApplicationUser>())
			.Returns(Task.FromException<string>(new InvalidOperationException("Email service down")));

		// Act
		UserDto result =
			await CreateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				TimeProvider,
				Logger,
				CancellationToken.None);

		// Assert - User creation should succeed despite email failure
		result.ShouldNotBeNull();
		result.Username.ShouldBe("newuser");
	}

	/// <summary>
	/// Tests that CreateDate is set from TimeProvider.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SetsCreateDateFromTimeProviderAsync()
	{
		// Arrange - Advance time forward from default time
		DateTimeOffset expectedTime =
			TestDates.DaysFromDefault(1);
		TimeProvider.SetUtcNow(expectedTime);

		CreateUserRequest request =
			new()
			{
				Username = "newuser",
				Email = "new@example.com",
				FullName = "Test User",
			};

		ApplicationUser? capturedUser =
			null;

		UserManager
			.CreateAsync(Arg.Do<ApplicationUser>(
				user =>
				{
					user.Id = 42;
					capturedUser = user;
				}))
			.Returns(IdentityResult.Success);

		UserManager
			.GeneratePasswordResetTokenAsync(Arg.Any<ApplicationUser>())
			.Returns("token");

		// Act
		await CreateUserCommandHandler.HandleAsync(
			request,
			MessageBus,
			UserManager,
			IdentityCache,
			TimeProvider,
			Logger,
			CancellationToken.None);

		// Assert
		capturedUser.ShouldNotBeNull();
		capturedUser.CreateDate.ShouldBe(expectedTime.UtcDateTime);
	}
}