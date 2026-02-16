// <copyright file="UsersControllerTests.cs" company="SeventySix">
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
/// Unit tests for UsersController.
/// Tests HTTP endpoint behavior and response handling.
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Mock service dependencies
/// - Test HTTP status codes
/// - Test response data correctness
/// - Test error scenarios
///
/// Coverage Focus:
/// - GetAllAsync endpoint
/// - GetByIdAsync endpoint
/// - CreateAsync endpoint
/// - Proper HTTP status codes (200, 201, 404, 500)
/// - Logger integration
/// </remarks>
public class UsersControllerTests
{
	private readonly IMessageBus MessageBus;
	private readonly ILogger<UsersController> Logger;
	private readonly IOutputCacheStore OutputCacheStore;
	private readonly UsersController Controller;

	public UsersControllerTests()
	{
		MessageBus = Substitute.For<IMessageBus>();
		Logger =
			Substitute.For<ILogger<UsersController>>();
		OutputCacheStore =
			Substitute.For<IOutputCacheStore>();
		Controller =
			new UsersController(
				MessageBus,
				Logger,
				OutputCacheStore);
	}

	#region Constructor Tests

	// Note: UsersController uses primary constructor syntax which relies on
	// dependency injection to provide non-null dependencies.
	// ArgumentNullException tests are not applicable with this pattern.

	#endregion

	#region GetByIdAsync Tests

	[Fact]
	public async Task GetByIdAsync_ShouldReturnOkWithUser_WhenUserExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		UserDto userDto =
			new UserDtoBuilder(timeProvider)
			.WithId(123)
			.WithUsername("john_doe")
			.WithEmail("john@example.com")
			.WithFullName("John Doe")
			.WithIsActive(true)
			.WithCreatedBy("System")
			.WithModifiedBy("System")
			.Build();

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByIdQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(userDto);

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByIdAsync(
			123,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		UserDto returnedUser =
			okResult.Value.ShouldBeOfType<UserDto>();
		returnedUser.Id.ShouldBe(123);
		returnedUser.Username.ShouldBe("john_doe");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNotFound_WhenUserDoesNotExistAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByIdQuery>(),
				Arg.Any<CancellationToken>())
			.Returns((UserDto?)null);

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByIdAsync(
			999,
			CancellationToken.None);

		// Assert
		result.Result.ShouldBeOfType<NotFoundResult>();
	}

	#endregion

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

	#region GetPagedAsync Tests

	[Fact]
	public async Task GetPagedAsync_ValidRequest_ReturnsOkWithPagedResultAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		UserQueryRequest request =
			new UserQueryRequest
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = "test",
			};

		List<UserDto> users =
			[
			new UserDtoBuilder(timeProvider)
				.WithId(1)
				.WithUsername("testuser1")
				.WithEmail("test1@example.com")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build(),
			new UserDtoBuilder(timeProvider)
				.WithId(2)
				.WithUsername("testuser2")
				.WithEmail("test2@example.com")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build(),
		];

		PagedResult<UserDto> pagedResult =
			new PagedResult<UserDto>
			{
				Items = users,
				Page = 1,
				PageSize = 10,
				TotalCount = 2,
			};

		MessageBus
			.InvokeAsync<PagedResult<UserDto>>(
				Arg.Any<GetPagedUsersQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(pagedResult);

		// Act
		ActionResult<PagedResult<UserDto>> result =
			await Controller.GetPagedAsync(request, CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		PagedResult<UserDto> returnedResult =
			okResult.Value.ShouldBeOfType<
			PagedResult<UserDto>
		>();
		returnedResult.Items.Count().ShouldBe(2);
		returnedResult.Page.ShouldBe(1);
		returnedResult.PageSize.ShouldBe(10);
		returnedResult.TotalCount.ShouldBe(2);
	}

	#endregion

	#region GetByUsernameAsync Tests

	[Fact]
	public async Task GetByUsernameAsync_UserExists_ReturnsOkWithUserAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		UserDto user =
			new UserDtoBuilder(timeProvider)
			.WithId(1)
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.WithIsActive(true)
			.WithCreatedBy("System")
			.WithModifiedBy("System")
			.Build();

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByUsernameQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(user);

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByUsernameAsync(
			"testuser",
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		UserDto returnedUser =
			okResult.Value.ShouldBeOfType<UserDto>();
		returnedUser.Username.ShouldBe("testuser");
	}

	[Fact]
	public async Task GetByUsernameAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByUsernameQuery>(),
				Arg.Any<CancellationToken>())
			.Returns((UserDto?)null);

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByUsernameAsync(
			"nonexistent",
			CancellationToken.None);

		// Assert
		result.Result.ShouldBeOfType<NotFoundResult>();
	}

	#endregion

	#region CheckUsernameAsync Tests

	[Fact]
	public async Task CheckUsernameAsync_UsernameExists_ReturnsTrueAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<bool>(
				Arg.Is<CheckUsernameExistsQuery>(
					query =>
						query.Username == "existinguser"
							&& query.ExcludeUserId == null),
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		ActionResult<bool> result =
			await Controller.CheckUsernameAsync(
			"existinguser",
			null,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		okResult.Value.ShouldNotBeNull();
		bool exists =
			(bool)okResult.Value;
		exists.ShouldBeTrue();
	}

	[Fact]
	public async Task CheckUsernameAsync_UsernameNotFound_ReturnsFalseAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<bool>(
				Arg.Is<CheckUsernameExistsQuery>(
					query =>
						query.Username == "newuser"
							&& query.ExcludeUserId == null),
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		ActionResult<bool> result =
			await Controller.CheckUsernameAsync(
			"newuser",
			null,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		okResult.Value.ShouldNotBeNull();
		bool exists =
			(bool)okResult.Value;
		exists.ShouldBeFalse();
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