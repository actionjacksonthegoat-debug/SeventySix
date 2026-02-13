// <copyright file="UpdateUserCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Wolverine;

namespace SeventySix.Identity.Tests.Commands.UpdateUser;

/// <summary>
/// Unit tests for <see cref="UpdateUserCommandHandler"/>.
/// Tests update logic with mocked dependencies following 80/20 rule.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests critical update paths including validation and duplicate handling.
/// </remarks>
public class UpdateUserCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IMessageBus MessageBus;
	private readonly IIdentityCacheService IdentityCache;
	private readonly ILogger Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserCommandHandlerTests"/> class.
	/// </summary>
	public UpdateUserCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		MessageBus =
			Substitute.For<IMessageBus>();
		IdentityCache =
			Substitute.For<IIdentityCacheService>();
		Logger =
			Substitute.For<ILogger>();
	}

	/// <summary>
	/// Tests successful user update.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_UpdatesUserAsync()
	{
		// Arrange
		const int UserId = 42;
		ApplicationUser existingUser =
			CreateUser(
				UserId,
				"oldusername",
				"old@example.com");

		UpdateUserRequest request =
			new()
			{
				Id = UserId,
				Username = "newusername",
				Email = "new@example.com",
				FullName = "New Name",
				IsActive = true,
			};

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(existingUser);

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		// Act
		UserDto result =
			await UpdateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				Logger,
				CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Username.ShouldBe("newusername");
		result.Email.ShouldBe("new@example.com");
		result.FullName.ShouldBe("New Name");
	}

	/// <summary>
	/// Tests that non-existing user throws exception.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ThrowsUserNotFoundExceptionAsync()
	{
		// Arrange
		const int UserId = 999;
		UpdateUserRequest request =
			new()
			{
				Id = UserId,
				Username = "anyuser",
				Email = "any@example.com",
			};

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns((ApplicationUser?)null);

		// Act & Assert
		await Should.ThrowAsync<UserNotFoundException>(async () =>
			await UpdateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				Logger,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that duplicate username throws exception.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DuplicateUsername_ThrowsDuplicateUserExceptionAsync()
	{
		// Arrange
		const int UserId = 42;
		ApplicationUser existingUser =
			CreateUser(
				UserId,
				"original",
				"original@example.com");

		UpdateUserRequest request =
			new()
			{
				Id = UserId,
				Username = "taken",
				Email = "original@example.com",
			};

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(existingUser);

		IdentityError error =
			new() { Code = "DuplicateUserName" };

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(error));

		// Act & Assert
		await Should.ThrowAsync<DuplicateUserException>(async () =>
			await UpdateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				Logger,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that duplicate email throws exception.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DuplicateEmail_ThrowsDuplicateUserExceptionAsync()
	{
		// Arrange
		const int UserId = 42;
		ApplicationUser existingUser =
			CreateUser(
				UserId,
				"original",
				"original@example.com");

		UpdateUserRequest request =
			new()
			{
				Id = UserId,
				Username = "original",
				Email = "taken@example.com",
			};

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(existingUser);

		IdentityError error =
			new() { Code = "DuplicateEmail" };

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(error));

		// Act & Assert
		await Should.ThrowAsync<DuplicateUserException>(async () =>
			await UpdateUserCommandHandler.HandleAsync(
				request,
				MessageBus,
				UserManager,
				IdentityCache,
				Logger,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that other identity errors throw InvalidOperationException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_OtherIdentityError_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		const int UserId = 42;
		ApplicationUser existingUser =
			CreateUser(
				UserId,
				"original",
				"original@example.com");

		UpdateUserRequest request =
			new()
			{
				Id = UserId,
				Username = "newuser",
				Email = "new@example.com",
			};

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(existingUser);

		IdentityError error =
			new()
			{
				Code = "UnknownError",
				Description = "Some unknown error",
			};

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(error));

		// Act & Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(async () =>
				await UpdateUserCommandHandler.HandleAsync(
					request,
					MessageBus,
					UserManager,
					IdentityCache,
					Logger,
					CancellationToken.None));

		exception.Message.ShouldContain("Some unknown error");
	}

	/// <summary>
	/// Tests that user properties are updated correctly.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_UpdatesAllPropertiesAsync()
	{
		// Arrange
		const int UserId = 42;
		ApplicationUser existingUser =
			CreateUser(
				UserId,
				"olduser",
				"old@example.com");

		existingUser.FullName = "Old Name";
		existingUser.IsActive = false;

		UpdateUserRequest request =
			new()
			{
				Id = UserId,
				Username = "newuser",
				Email = "new@example.com",
				FullName = "New Name",
				IsActive = true,
			};

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(existingUser);

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		// Act
		await UpdateUserCommandHandler.HandleAsync(
			request,
			MessageBus,
			UserManager,
			IdentityCache,
			Logger,
			CancellationToken.None);

		// Assert - Verify properties were updated on the entity
		existingUser.UserName.ShouldBe("newuser");
		existingUser.Email.ShouldBe("new@example.com");
		existingUser.FullName.ShouldBe("New Name");
		existingUser.IsActive.ShouldBeTrue();
	}

	private static ApplicationUser CreateUser(
		int userId,
		string username,
		string email)
	{
		FakeTimeProvider timeProvider =
			new(TestTimeProviderBuilder.DefaultTime);

		return new UserBuilder(timeProvider)
			.WithId(userId)
			.WithUsername(username)
			.WithEmail(email)
			.WithIsActive(true)
			.Build();
	}
}