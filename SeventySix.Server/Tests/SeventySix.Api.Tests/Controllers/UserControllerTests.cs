// <copyright file="UsersControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.Builders;

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
	private readonly IUserQueryService UserQueryService;
	private readonly IUserAdminService UserAdminService;
	private readonly IUserProfileService UserProfileService;
	private readonly IUserValidationService UserValidationService;
	private readonly IUserRoleService UserRoleService;
	private readonly IPasswordService PasswordService;
	private readonly IPermissionRequestService PermissionRequestService;
	private readonly ILogger<UsersController> Logger;
	private readonly UsersController Controller;

	public UsersControllerTests()
	{
		UserQueryService = Substitute.For<IUserQueryService>();
		UserAdminService = Substitute.For<IUserAdminService>();
		UserProfileService = Substitute.For<IUserProfileService>();
		UserValidationService = Substitute.For<IUserValidationService>();
		UserRoleService = Substitute.For<IUserRoleService>();
		PasswordService = Substitute.For<IPasswordService>();
		PermissionRequestService = Substitute.For<IPermissionRequestService>();
		Logger = Substitute.For<ILogger<UsersController>>();
		Controller = new UsersController(
			UserQueryService,
			UserAdminService,
			UserProfileService,
			UserValidationService,
			UserRoleService,
			PasswordService,
			PermissionRequestService,
			Logger);
	}

	#region Constructor Tests

	// Note: UsersController uses primary constructor syntax which relies on
	// dependency injection to provide non-null dependencies.
	// ArgumentNullException tests are not applicable with this pattern.

	#endregion

	#region GetAllAsync Tests

	[Fact]
	public async Task GetAllAsync_ShouldReturnOkWithUsers_WhenUsersExistAsync()
	{
		// Arrange
		List<UserDto> users =
		[
			new UserDtoBuilder().WithId(1).WithUsername("user1").WithEmail("user1@example.com").WithIsActive(true).Build(),
			new UserDtoBuilder().WithId(2).WithUsername("user2").WithEmail("user2@example.com").WithIsActive(false).Build(),
		];

		UserQueryService
			.GetAllUsersAsync(Arg.Any<CancellationToken>())
			.Returns(users);

		// Act
		ActionResult<IEnumerable<UserDto>> result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<UserDto> returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
		Assert.Equal(2, returnedUsers.Count());

		await UserQueryService.Received(1).GetAllUsersAsync(Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnOkWithEmptyList_WhenNoUsersExistAsync()
	{
		// Arrange
		UserQueryService
			.GetAllUsersAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		ActionResult<IEnumerable<UserDto>> result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<UserDto> returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
		Assert.Empty(returnedUsers);
	}

	#endregion

	#region GetByIdAsync Tests

	[Fact]
	public async Task GetByIdAsync_ShouldReturnOkWithUser_WhenUserExistsAsync()
	{
		// Arrange
		UserDto userDto =
			new UserDtoBuilder()
				.WithId(123)
				.WithUsername("john_doe")
				.WithEmail("john@example.com")
				.WithFullName("John Doe")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build();

		UserQueryService
			.GetUserByIdAsync(123, Arg.Any<CancellationToken>())
			.Returns(userDto);

		// Act
		ActionResult<UserDto> result = await Controller.GetByIdAsync(123, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		UserDto returnedUser = Assert.IsType<UserDto>(okResult.Value);
		Assert.Equal(123, returnedUser.Id);
		Assert.Equal("john_doe", returnedUser.Username);
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNotFound_WhenUserDoesNotExistAsync()
	{
		// Arrange
		UserQueryService
			.GetUserByIdAsync(999, Arg.Any<CancellationToken>())
			.Returns((UserDto?)null);

		// Act
		ActionResult<UserDto> result = await Controller.GetByIdAsync(999, CancellationToken.None);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	#endregion

	#region CreateAsync Tests

	[Fact]
	public async Task CreateAsync_ShouldReturnCreatedAtRoute_WhenUserIsCreatedAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "new_user",
			Email = "new@example.com",
			FullName = "New User",
			IsActive = true,
		};

		UserDto createdUser =
			new UserDtoBuilder()
				.WithId(456)
				.WithUsername("new_user")
				.WithEmail("new@example.com")
				.WithFullName("New User")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build();

		UserAdminService
			.CreateUserAsync(request, Arg.Any<CancellationToken>())
			.Returns(createdUser);

		// Act
		ActionResult<UserDto> result = await Controller.CreateAsync(request, CancellationToken.None);

		// Assert
		CreatedAtRouteResult createdResult = Assert.IsType<CreatedAtRouteResult>(result.Result);
		Assert.Equal("GetUserById", createdResult.RouteName);
		Assert.Equal(456, createdResult.RouteValues!["id"]);

		UserDto returnedUser = Assert.IsType<UserDto>(createdResult.Value);
		Assert.Equal(456, returnedUser.Id);
		Assert.Equal("new_user", returnedUser.Username);
	}

	[Fact]
	public async Task CreateAsync_ShouldCallServiceWithCorrectRequestAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "test",
			Email = "test@example.com",
			FullName = "Test User",
		};

		UserDto createdUser =
			new UserDtoBuilder()
				.WithId(1)
				.WithUsername("test")
				.WithEmail("test@example.com")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build();

		UserAdminService
			.CreateUserAsync(request, Arg.Any<CancellationToken>())
			.Returns(createdUser);

		// Act
		await Controller.CreateAsync(request, CancellationToken.None);

		// Assert
		await UserAdminService.Received(1).CreateUserAsync(
			Arg.Is<CreateUserRequest>(r =>
				r.Username == "test" &&
				r.Email == "test@example.com"),
			Arg.Any<CancellationToken>());
	}

	#endregion

	#region UpdateAsync Tests

	[Fact]
	public async Task UpdateAsync_ValidRequest_ReturnsOkWithUpdatedUserAsync()
	{
		// Arrange
		UpdateUserRequest request = new UpdateUserRequest
		{
			Id = 1,
			Username = "updateduser",
			Email = "updated@example.com",
			FullName = "Updated User",
			IsActive = true,
		};

		UserDto updatedUser =
			new UserDtoBuilder()
				.WithId(1)
				.WithUsername("updateduser")
				.WithEmail("updated@example.com")
				.WithFullName("Updated User")
				.WithIsActive(true)
				.WithCreateDate(DateTime.UtcNow.AddDays(-1))
				.WithModifyDate(DateTime.UtcNow)
				.WithCreatedBy("System")
				.WithModifiedBy("Admin")
				.Build();

		UserAdminService
			.UpdateUserAsync(request, Arg.Any<CancellationToken>())
			.Returns(updatedUser);

		// Act
		ActionResult<UserDto> result = await Controller.UpdateAsync(1, request, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		UserDto returnedUser = Assert.IsType<UserDto>(okResult.Value);
		Assert.Equal(1, returnedUser.Id);
		Assert.Equal("updateduser", returnedUser.Username);
		Assert.NotNull(returnedUser.ModifyDate);
	}

	[Fact]
	public async Task UpdateAsync_MismatchedId_ReturnsBadRequestAsync()
	{
		// Arrange
		UpdateUserRequest request = new UpdateUserRequest
		{
			Id = 1,
			Username = "test",
			Email = "test@example.com",
			IsActive = true,
		};

		// Act
		ActionResult<UserDto> result = await Controller.UpdateAsync(2, request, CancellationToken.None);

		// Assert
		BadRequestObjectResult badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal("ID in URL does not match ID in request body", badRequestResult.Value);

		await UserAdminService.DidNotReceive().UpdateUserAsync(Arg.Any<UpdateUserRequest>(), Arg.Any<CancellationToken>());
	}

	#endregion

	#region DeleteAsync Tests

	[Fact]
	public async Task DeleteAsync_UserExists_ReturnsNoContentAsync()
	{
		// Arrange
		UserAdminService
			.DeleteUserAsync(1, Arg.Any<string>(), Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		IActionResult result = await Controller.DeleteAsync(1, CancellationToken.None);

		// Assert
		Assert.IsType<NoContentResult>(result);
	}

	[Fact]
	public async Task DeleteAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		UserAdminService
			.DeleteUserAsync(999, Arg.Any<string>(), Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		IActionResult result = await Controller.DeleteAsync(999, CancellationToken.None);

		// Assert
		Assert.IsType<NotFoundResult>(result);
	}

	#endregion

	#region RestoreAsync Tests

	[Fact]
	public async Task RestoreAsync_UserExists_ReturnsNoContentAsync()
	{
		// Arrange
		UserAdminService
			.RestoreUserAsync(1, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		IActionResult result = await Controller.RestoreAsync(1, CancellationToken.None);

		// Assert
		Assert.IsType<NoContentResult>(result);
	}

	[Fact]
	public async Task RestoreAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		UserAdminService
			.RestoreUserAsync(999, Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		IActionResult result = await Controller.RestoreAsync(999, CancellationToken.None);

		// Assert
		Assert.IsType<NotFoundResult>(result);
	}

	#endregion

	#region GetPagedAsync Tests

	[Fact]
	public async Task GetPagedAsync_ValidRequest_ReturnsOkWithPagedResultAsync()
	{
		// Arrange
		UserQueryRequest request = new UserQueryRequest
		{
			Page = 1,
			PageSize = 10,
			SearchTerm = "test",
		};

		List<UserDto> users =
		[
			new UserDtoBuilder().WithId(1).WithUsername("testuser1").WithEmail("test1@example.com").WithIsActive(true).WithCreatedBy("System").WithModifiedBy("System").Build(),
			new UserDtoBuilder().WithId(2).WithUsername("testuser2").WithEmail("test2@example.com").WithIsActive(true).WithCreatedBy("System").WithModifiedBy("System").Build(),
		];

		PagedResult<UserDto> pagedResult = new PagedResult<UserDto>
		{
			Items = users,
			Page = 1,
			PageSize = 10,
			TotalCount = 2,
		};

		UserQueryService
			.GetPagedUsersAsync(request, Arg.Any<CancellationToken>())
			.Returns(pagedResult);

		// Act
		ActionResult<PagedResult<UserDto>> result = await Controller.GetPagedAsync(request, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		PagedResult<UserDto> returnedResult = Assert.IsType<PagedResult<UserDto>>(okResult.Value);
		Assert.Equal(2, returnedResult.Items.Count());
		Assert.Equal(1, returnedResult.Page);
		Assert.Equal(10, returnedResult.PageSize);
		Assert.Equal(2, returnedResult.TotalCount);
	}

	#endregion

	#region GetByUsernameAsync Tests

	[Fact]
	public async Task GetByUsernameAsync_UserExists_ReturnsOkWithUserAsync()
	{
		// Arrange
		UserDto user =
			new UserDtoBuilder()
				.WithId(1)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build();

		UserQueryService
			.GetByUsernameAsync("testuser", Arg.Any<CancellationToken>())
			.Returns(user);

		// Act
		ActionResult<UserDto> result = await Controller.GetByUsernameAsync("testuser", CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		UserDto returnedUser = Assert.IsType<UserDto>(okResult.Value);
		Assert.Equal("testuser", returnedUser.Username);
	}

	[Fact]
	public async Task GetByUsernameAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		UserQueryService
			.GetByUsernameAsync("nonexistent", Arg.Any<CancellationToken>())
			.Returns((UserDto?)null);

		// Act
		ActionResult<UserDto> result = await Controller.GetByUsernameAsync("nonexistent", CancellationToken.None);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	#endregion

	#region CheckUsernameAsync Tests

	[Fact]
	public async Task CheckUsernameAsync_UsernameExists_ReturnsTrueAsync()
	{
		// Arrange
		UserValidationService
			.UsernameExistsAsync("existinguser", null, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		ActionResult<bool> result = await Controller.CheckUsernameAsync("existinguser", null, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		Assert.NotNull(okResult.Value);
		bool exists = (bool)okResult.Value;
		Assert.True(exists);
	}

	[Fact]
	public async Task CheckUsernameAsync_UsernameNotFound_ReturnsFalseAsync()
	{
		// Arrange
		UserValidationService
			.UsernameExistsAsync("newuser", null, Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		ActionResult<bool> result = await Controller.CheckUsernameAsync("newuser", null, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		Assert.NotNull(okResult.Value);
		bool exists = (bool)okResult.Value;
		Assert.False(exists);
	}

	#endregion

	#region BulkActivateAsync Tests

	[Fact]
	public async Task BulkActivateAsync_ValidRequest_ReturnsOkWithCountAsync()
	{
		// Arrange
		List<int> ids = [1, 2, 3];
		int expectedCount = 3;

		UserAdminService
			.BulkUpdateActiveStatusAsync(ids, true, Arg.Any<string>(), Arg.Any<CancellationToken>())
			.Returns(expectedCount);

		// Act
		ActionResult<int> result = await Controller.BulkActivateAsync(ids, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		int count = Assert.IsType<int>(okResult.Value);
		Assert.Equal(3, count);
	}

	[Fact]
	public async Task BulkDeactivateAsync_ValidRequest_ReturnsOkWithCountAsync()
	{
		// Arrange
		List<int> ids = [1, 2, 3];
		int expectedCount = 3;

		UserAdminService
			.BulkUpdateActiveStatusAsync(ids, false, Arg.Any<string>(), Arg.Any<CancellationToken>())
			.Returns(expectedCount);

		// Act
		ActionResult<int> result = await Controller.BulkDeactivateAsync(ids, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		int count = Assert.IsType<int>(okResult.Value);
		Assert.Equal(3, count);
	}

	#endregion
}