// <copyright file="GetUserByUsernameQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Queries.GetUserByUsername;

/// <summary>
/// Unit tests for <see cref="GetUserByUsernameQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and null handling.
/// </remarks>
public class GetUserByUsernameQueryHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetUserByUsernameQueryHandlerTests"/> class.
	/// </summary>
	public GetUserByUsernameQueryHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
	}

	/// <summary>
	/// Tests successful retrieval of user by username.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserExists_ReturnsUserDtoAsync()
	{
		// Arrange
		const string Username = "testuser";

		ApplicationUser user =
			new()
			{
				Id = 42,
				UserName = Username,
				Email = "test@example.com",
				IsActive = true,
			};

		GetUserByUsernameQuery query =
			new(Username);

		UserManager
			.FindByNameAsync(Username)
			.Returns(user);

		// Act
		UserDto? result =
			await GetUserByUsernameQueryHandler.HandleAsync(
				query,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBe(42);
		result.Username.ShouldBe(Username);
	}

	/// <summary>
	/// Tests that null is returned when user not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsNullAsync()
	{
		// Arrange
		const string Username = "nonexistent";

		GetUserByUsernameQuery query =
			new(Username);

		UserManager
			.FindByNameAsync(Username)
			.Returns((ApplicationUser?)null);

		// Act
		UserDto? result =
			await GetUserByUsernameQueryHandler.HandleAsync(
				query,
				UserManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Tests that UserManager method is called with correct username.
	/// </summary>
	[Fact]
	public async Task HandleAsync_CallsUserManagerWithCorrectUsernameAsync()
	{
		// Arrange
		const string Username = "testuser";

		GetUserByUsernameQuery query =
			new(Username);

		UserManager
			.FindByNameAsync(Username)
			.Returns((ApplicationUser?)null);

		// Act
		await GetUserByUsernameQueryHandler.HandleAsync(
			query,
			UserManager,
			CancellationToken.None);

		// Assert
		await UserManager
			.Received(1)
			.FindByNameAsync(Username);
	}
}