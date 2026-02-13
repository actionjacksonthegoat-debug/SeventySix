// <copyright file="UpdateProfileCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Wolverine;

namespace SeventySix.Identity.Tests.Commands.UpdateProfile;

/// <summary>
/// Unit tests for <see cref="UpdateProfileCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical validation paths.
/// </remarks>
public class UpdateProfileCommandHandlerTests
{
	private readonly FakeTimeProvider TimeProvider;
	private readonly IMessageBus MessageBus;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IIdentityCacheService IdentityCache;

	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileCommandHandlerTests"/> class.
	/// </summary>
	public UpdateProfileCommandHandlerTests()
	{
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
		MessageBus =
			Substitute.For<IMessageBus>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		IdentityCache =
			Substitute.For<IIdentityCacheService>();
	}

	/// <summary>
	/// Tests successful profile update.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_UpdatesProfileAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithFullName("Test User")
				.WithIsActive(true)
				.Build();
		UpdateProfileCommand command =
			CreateUpdateCommand(
				user.Id,
				"newemail@example.com",
				"New Name");

		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);
		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		UserProfileDto expectedProfile =
			new(
				Id: user.Id,
				Username: user.UserName!,
				Email: "newemail@example.com",
				FullName: "New Name",
				Roles: [],
				HasPassword: true,
				LinkedProviders: [],
				LastLoginAt: null);

		MessageBus
			.InvokeAsync<UserProfileDto?>(
				Arg.Any<GetUserProfileQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedProfile);

		// Act
		UserProfileDto? result =
			await UpdateProfileCommandHandler.HandleAsync(
				command,
				MessageBus,
				UserManager,
				IdentityCache,
				CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		await UserManager
			.Received(1)
			.UpdateAsync(
				Arg.Is<ApplicationUser>(updatedUser =>
					updatedUser.Email == "newemail@example.com" &&
					updatedUser.FullName == "New Name"));
	}

	/// <summary>
	/// Tests update failure when user does not exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsNullAsync()
	{
		// Arrange
		UpdateProfileCommand command =
			CreateUpdateCommand(
				999,
				"newemail@example.com",
				"New Name");

		UserManager
			.FindByIdAsync(Arg.Any<string>())
			.Returns((ApplicationUser?)null);

		// Act
		UserProfileDto? result =
			await UpdateProfileCommandHandler.HandleAsync(
				command,
				MessageBus,
				UserManager,
				IdentityCache,
				CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Tests update failure when email is already taken.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DuplicateEmail_ThrowsDuplicateUserExceptionAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithFullName("Test User")
				.WithIsActive(true)
				.Build();
		UpdateProfileCommand command =
			CreateUpdateCommand(
				user.Id,
				"taken@example.com",
				"New Name");

		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);
		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "DuplicateEmail",
						Description = "Email is already taken",
					}));

		// Act & Assert
		await Should.ThrowAsync<DuplicateUserException>(async () =>
			await UpdateProfileCommandHandler.HandleAsync(
				command,
				MessageBus,
				UserManager,
				IdentityCache,
				CancellationToken.None));
	}

	private static UpdateProfileCommand CreateUpdateCommand(
		long userId,
		string email,
		string fullName) =>
		new(
			UserId: userId,
			Request: new UpdateProfileRequest(
				Email: email,
				FullName: fullName));
}