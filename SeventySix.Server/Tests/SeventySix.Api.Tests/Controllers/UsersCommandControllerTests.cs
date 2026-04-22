// <copyright file="UsersCommandControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Builders;
using Shouldly;
using Wolverine;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for UsersCommandController.
/// Tests HTTP POST/PUT/DELETE endpoint behavior and response handling.
/// </summary>
public sealed class UsersCommandControllerTests
{
	private readonly IMessageBus MessageBus;
	private readonly ILogger<UsersCommandController> Logger;
	private readonly IOutputCacheStore OutputCacheStore;
	private readonly UsersCommandController Controller;

	public UsersCommandControllerTests()
	{
		MessageBus = Substitute.For<IMessageBus>();
		Logger =
			Substitute.For<ILogger<UsersCommandController>>();
		OutputCacheStore =
			Substitute.For<IOutputCacheStore>();
		Controller =
			new UsersCommandController(
				MessageBus,
				Logger,
				OutputCacheStore);
	}

	#region CreateAsync Tests

	[Fact]
	public async Task CreateAsync_ShouldReturnCreatedAtRoute_WhenUserIsCreatedAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		CreateUserRequest request =
			new()
			{
				Username = "new_user",
				Email = "new@example.com",
				FullName = "New User",
				IsActive = true,
			};

		UserDto createdUser =
			new UserDtoBuilder(timeProvider)
			.WithId(456)
			.WithUsername("new_user")
			.WithEmail("new@example.com")
			.WithFullName("New User")
			.WithIsActive(true)
			.WithCreatedBy("System")
			.WithModifiedBy("System")
			.Build();

		MessageBus
			.InvokeAsync<UserDto>(
				Arg.Any<CreateUserRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(createdUser);

		// Act
		ActionResult<UserDto> result =
			await Controller.CreateAsync(
			request,
			CancellationToken.None);

		// Assert
		CreatedAtRouteResult createdResult =
			result.Result.ShouldBeOfType<CreatedAtRouteResult>();
		createdResult.RouteName.ShouldBe("GetUserById");
		(long.TryParse(
			createdResult.RouteValues!["id"]?.ToString(),
			out long id)
			? id
			: 0L).ShouldBe(456L);

		UserDto returnedUser =
			createdResult.Value.ShouldBeOfType<UserDto>();
		returnedUser.Id.ShouldBe(456L);
		returnedUser.Username.ShouldBe("new_user");
	}

	[Fact]
	public async Task CreateAsync_ShouldCallServiceWithCorrectRequestAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		CreateUserRequest request =
			new()
			{
				Username = "test",
				Email = "test@example.com",
				FullName = "Test User",
			};

		UserDto createdUser =
			new UserDtoBuilder(timeProvider)
			.WithId(1)
			.WithUsername("test")
			.WithEmail("test@example.com")
			.WithIsActive(true)
			.WithCreatedBy("System")
			.WithModifiedBy("System")
			.Build();

		MessageBus
			.InvokeAsync<UserDto>(
				Arg.Any<CreateUserRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(createdUser);

		// Act
		await Controller.CreateAsync(request, CancellationToken.None);

		// Assert
		await MessageBus
			.Received(1)
			.InvokeAsync<UserDto>(
				Arg.Is<CreateUserRequest>(req =>
					req.Username == "test" && req.Email == "test@example.com"),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region UpdateAsync Tests

	[Fact]
	public async Task UpdateAsync_ValidRequest_ReturnsOkWithUpdatedUserAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		UpdateUserRequest request =
			new UpdateUserRequest
			{
				Id = 1,
				Username = "updateduser",
				Email = "updated@example.com",
				FullName = "Updated User",
				IsActive = true,
			};

		UserDto updatedUser =
			new UserDtoBuilder(timeProvider)
			.WithId(1)
			.WithUsername("updateduser")
			.WithEmail("updated@example.com")
			.WithFullName("Updated User")
			.WithIsActive(true)
			.WithCreateDate(timeProvider.GetUtcNow().AddDays(-1))
			.WithModifyDate(timeProvider.GetUtcNow())
			.WithCreatedBy("System")
			.WithModifiedBy("Admin")
			.Build();

		MessageBus
			.InvokeAsync<UserDto>(
				Arg.Any<UpdateUserRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(updatedUser);

		// Act
		ActionResult<UserDto> result =
			await Controller.UpdateAsync(
			1,
			request,
			CancellationToken.None);
		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		UserDto returnedUser =
			okResult.Value.ShouldBeOfType<UserDto>();
		returnedUser.Id.ShouldBe(1);
		returnedUser.Username.ShouldBe("updateduser");
		returnedUser.ModifyDate.ShouldNotBeNull();
	}

	[Fact]
	public async Task UpdateAsync_MismatchedId_ReturnsBadRequestAsync()
	{
		// Arrange
		UpdateUserRequest request =
			new UpdateUserRequest
			{
				Id = 1,
				Username = "test",
				Email = "test@example.com",
				IsActive = true,
			};

		// Act
		ActionResult<UserDto> result =
			await Controller.UpdateAsync(
			2,
			request,
			CancellationToken.None);

		// Assert
		BadRequestObjectResult badRequestResult =
			result.Result.ShouldBeOfType<BadRequestObjectResult>();
		ProblemDetails problemDetails =
			badRequestResult.Value.ShouldBeOfType<ProblemDetails>();
		problemDetails.Detail.ShouldBe(
			"ID in URL does not match ID in request body");

		await MessageBus
			.DidNotReceive()
			.InvokeAsync<UserDto>(
				Arg.Any<UpdateUserRequest>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region DeleteAsync Tests

	[Fact]
	public async Task DeleteAsync_UserExists_ReturnsNoContentAsync()
	{
		// Arrange
		Controller.ControllerContext =
			CreateControllerContextWithUser("testadmin");

		MessageBus
			.InvokeAsync<Result>(
				Arg.Any<DeleteUserCommand>(),
				Arg.Any<CancellationToken>())
			.Returns(Result.Success());

		// Act
		IActionResult result =
			await Controller.DeleteAsync(
			1,
			CancellationToken.None);

		// Assert
		result.ShouldBeOfType<NoContentResult>();
	}

	[Fact]
	public async Task DeleteAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		Controller.ControllerContext =
			CreateControllerContextWithUser("testadmin");

		MessageBus
			.InvokeAsync<Result>(
				Arg.Any<DeleteUserCommand>(),
				Arg.Any<CancellationToken>())
			.Returns(Result.Failure("User not found"));

		// Act
		IActionResult result =
			await Controller.DeleteAsync(
			999,
			CancellationToken.None);

		// Assert
		result.ShouldBeOfType<NotFoundResult>();
	}

	#endregion

	#region RestoreAsync Tests

	[Fact]
	public async Task RestoreAsync_UserExists_ReturnsNoContentAsync()
	{
		// Arrange
		Controller.ControllerContext =
			CreateControllerContextWithUser("testadmin");

		MessageBus
			.InvokeAsync<Result>(
				Arg.Any<RestoreUserCommand>(),
				Arg.Any<CancellationToken>())
			.Returns(Result.Success());

		// Act
		IActionResult result =
			await Controller.RestoreAsync(
			1,
			CancellationToken.None);

		// Assert
		result.ShouldBeOfType<NoContentResult>();
	}

	[Fact]
	public async Task RestoreAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		Controller.ControllerContext =
			CreateControllerContextWithUser("testadmin");

		MessageBus
			.InvokeAsync<Result>(
				Arg.Any<RestoreUserCommand>(),
				Arg.Any<CancellationToken>())
			.Returns(Result.Failure("User not found"));

		// Act
		IActionResult result =
			await Controller.RestoreAsync(
			999,
			CancellationToken.None);

		// Assert
		result.ShouldBeOfType<NotFoundResult>();
	}

	#endregion

	#region BulkActivateAsync Tests

	[Fact]
	public async Task BulkActivateAsync_ValidRequest_ReturnsOkWithCountAsync()
	{
		// Arrange
		Controller.ControllerContext =
			CreateControllerContextWithUser("testadmin");

		List<long> ids =
			[1, 2, 3];
		int expectedCount = 3;

		MessageBus
			.InvokeAsync<int>(
				Arg.Any<BulkUpdateActiveStatusCommand>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedCount);

		// Act
		ActionResult<int> result =
			await Controller.BulkActivateAsync(
			ids,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		int count =
			okResult.Value.ShouldBeOfType<int>();
		count.ShouldBe(3);
	}

	[Fact]
	public async Task BulkDeactivateAsync_ValidRequest_ReturnsOkWithCountAsync()
	{
		// Arrange
		Controller.ControllerContext =
			CreateControllerContextWithUser("testadmin");

		List<long> ids =
			[1, 2, 3];
		int expectedCount = 3;

		MessageBus
			.InvokeAsync<int>(
				Arg.Any<BulkUpdateActiveStatusCommand>(),
				Arg.Any<CancellationToken>())
			.Returns(expectedCount);

		// Act
		ActionResult<int> result =
			await Controller.BulkDeactivateAsync(
			ids,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		int count =
			okResult.Value.ShouldBeOfType<int>();
		count.ShouldBe(3);
	}

	#endregion

	#region Helper Methods

	/// <summary>
	/// Creates a ControllerContext with a mocked User containing the specified username.
	/// </summary>
	/// <param name="username">
	/// The username to include in the claims.
	/// </param>
	/// <returns>
	/// A configured ControllerContext with User claims.
	/// </returns>
	private static ControllerContext CreateControllerContextWithUser(string username)
	{
		List<Claim> claims =
			[
				new Claim(
					JwtRegisteredClaimNames.UniqueName,
					username),
			];

		ClaimsIdentity identity =
			new(
				claims,
				"TestAuthentication");

		ClaimsPrincipal principal =
			new(identity);

		return new ControllerContext
		{
			HttpContext =
				new DefaultHttpContext
				{
					User = principal,
				},
		};
	}

	#endregion
}