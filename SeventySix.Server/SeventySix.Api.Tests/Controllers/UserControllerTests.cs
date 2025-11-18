// <copyright file="UsersControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Api.Controllers;
using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.Core.DTOs;
using SeventySix.Core.Exceptions;

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
	private readonly Mock<IUserService> MockUserService;
	private readonly Mock<ILogger<UsersController>> MockLogger;
	private readonly UsersController Controller;

	public UsersControllerTests()
	{
		MockUserService = new Mock<IUserService>();
		MockLogger = new Mock<ILogger<UsersController>>();
		Controller = new UsersController(MockUserService.Object, MockLogger.Object);
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
			new UserDto { Id = 1, Username = "user1", Email = "user1@example.com", IsActive = true },
			new UserDto { Id = 2, Username = "user2", Email = "user2@example.com", IsActive = false },
		];

		MockUserService
			.Setup(s => s.GetAllUsersAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(users);

		// Act
		ActionResult<IEnumerable<UserDto>> result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<UserDto> returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
		Assert.Equal(2, returnedUsers.Count());

		MockUserService.Verify(s => s.GetAllUsersAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnOkWithEmptyList_WhenNoUsersExistAsync()
	{
		// Arrange
		MockUserService
			.Setup(s => s.GetAllUsersAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync([]);

		// Act
		ActionResult<IEnumerable<UserDto>> result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<UserDto> returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
		Assert.Empty(returnedUsers);
	}

	[Fact]
	public async Task GetAllAsync_ShouldLogInformationAsync()
	{
		// Arrange
		MockUserService
			.Setup(s => s.GetAllUsersAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync([]);

		// Act
		await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting all users")),
				null,
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	#endregion

	#region GetByIdAsync Tests

	[Fact]
	public async Task GetByIdAsync_ShouldReturnOkWithUser_WhenUserExistsAsync()
	{
		// Arrange
		UserDto userDto = new()
		{
			Id = 123,
			Username = "john_doe",
			Email = "john@example.com",
			FullName = "John Doe",
			IsActive = true,
		};

		MockUserService
			.Setup(s => s.GetUserByIdAsync(123, It.IsAny<CancellationToken>()))
			.ReturnsAsync(userDto);

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
		MockUserService
			.Setup(s => s.GetUserByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((UserDto?)null);

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

		UserDto createdUser = new()
		{
			Id = 456,
			Username = "new_user",
			Email = "new@example.com",
			FullName = "New User",
			IsActive = true,
			CreatedAt = DateTime.UtcNow,
		};

		MockUserService
			.Setup(s => s.CreateUserAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdUser);

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
		};

		UserDto createdUser = new()
		{
			Id = 1,
			Username = "test",
			Email = "test@example.com",
			IsActive = true,
			CreatedAt = DateTime.UtcNow,
		};

		MockUserService
			.Setup(s => s.CreateUserAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdUser);

		// Act
		await Controller.CreateAsync(request, CancellationToken.None);

		// Assert
		MockUserService.Verify(
			s => s.CreateUserAsync(
				It.Is<CreateUserRequest>(r =>
					r.Username == "test" &&
					r.Email == "test@example.com"),
				It.IsAny<CancellationToken>()),
			Times.Once);
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
			RowVersion = 1,
		};

		UserDto updatedUser = new UserDto
		{
			Id = 1,
			Username = "updateduser",
			Email = "updated@example.com",
			FullName = "Updated User",
			IsActive = true,
			CreatedAt = DateTime.UtcNow.AddDays(-1),
			ModifiedAt = DateTime.UtcNow,
			RowVersion = 2,
		};

		MockUserService
		.Setup(s => s.UpdateUserAsync(request, It.IsAny<CancellationToken>()))
		.ReturnsAsync(updatedUser);

		// Act
		ActionResult<UserDto> result = await Controller.UpdateAsync(1, request, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		UserDto returnedUser = Assert.IsType<UserDto>(okResult.Value);
		Assert.Equal(1, returnedUser.Id);
		Assert.Equal("updateduser", returnedUser.Username);
		Assert.NotNull(returnedUser.ModifiedAt);
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
			RowVersion = 1,
		};

		// Act
		ActionResult<UserDto> result = await Controller.UpdateAsync(2, request, CancellationToken.None);

		// Assert
		BadRequestObjectResult badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal("ID in URL does not match ID in request body", badRequestResult.Value);

		MockUserService.Verify(
		s => s.UpdateUserAsync(It.IsAny<UpdateUserRequest>(), It.IsAny<CancellationToken>()),
		Times.Never);
	}

	#endregion

	#region DeleteAsync Tests

	[Fact]
	public async Task DeleteAsync_UserExists_ReturnsNoContentAsync()
	{
		// Arrange
		MockUserService
		.Setup(s => s.DeleteUserAsync(1, It.IsAny<string>(), It.IsAny<CancellationToken>()))
		.ReturnsAsync(true);

		// Act
		IActionResult result = await Controller.DeleteAsync(1, CancellationToken.None);

		// Assert
		Assert.IsType<NoContentResult>(result);
	}

	[Fact]
	public async Task DeleteAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		MockUserService
		.Setup(s => s.DeleteUserAsync(999, It.IsAny<string>(), It.IsAny<CancellationToken>()))
		.ReturnsAsync(false);

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
		MockUserService
		.Setup(s => s.RestoreUserAsync(1, It.IsAny<CancellationToken>()))
		.ReturnsAsync(true);

		// Act
		IActionResult result = await Controller.RestoreAsync(1, CancellationToken.None);

		// Assert
		Assert.IsType<NoContentResult>(result);
	}

	[Fact]
	public async Task RestoreAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		MockUserService
		.Setup(s => s.RestoreUserAsync(999, It.IsAny<CancellationToken>()))
		.ReturnsAsync(false);

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
		new UserDto { Id = 1, Username = "testuser1", Email = "test1@example.com", IsActive = true },
new UserDto { Id = 2, Username = "testuser2", Email = "test2@example.com", IsActive = true },
];

		PagedResult<UserDto> pagedResult = new PagedResult<UserDto>
		{
			Items = users,
			Page = 1,
			PageSize = 10,
			TotalCount = 2,
		};

		MockUserService
		.Setup(s => s.GetPagedUsersAsync(request, It.IsAny<CancellationToken>()))
		.ReturnsAsync(pagedResult);

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
		UserDto user = new UserDto
		{
			Id = 1,
			Username = "testuser",
			Email = "test@example.com",
			IsActive = true,
		};

		MockUserService
		.Setup(s => s.GetByUsernameAsync("testuser", It.IsAny<CancellationToken>()))
		.ReturnsAsync(user);

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
		MockUserService
		.Setup(s => s.GetByUsernameAsync("nonexistent", It.IsAny<CancellationToken>()))
		.ReturnsAsync((UserDto?)null);

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
		MockUserService
		.Setup(s => s.UsernameExistsAsync("existinguser", null, It.IsAny<CancellationToken>()))
		.ReturnsAsync(true);

		// Act
		ActionResult<bool> result = await Controller.CheckUsernameAsync("existinguser", null, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		bool exists = Assert.IsType<bool>(okResult.Value);
		Assert.True(exists);
	}

	[Fact]
	public async Task CheckUsernameAsync_UsernameNotFound_ReturnsFalseAsync()
	{
		// Arrange
		MockUserService
		.Setup(s => s.UsernameExistsAsync("newuser", null, It.IsAny<CancellationToken>()))
		.ReturnsAsync(false);

		// Act
		ActionResult<bool> result = await Controller.CheckUsernameAsync("newuser", null, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		bool exists = Assert.IsType<bool>(okResult.Value);
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

		MockUserService
		.Setup(s => s.BulkUpdateActiveStatusAsync(ids, true, It.IsAny<string>(), It.IsAny<CancellationToken>()))
		.ReturnsAsync(expectedCount);

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

		MockUserService
		.Setup(s => s.BulkUpdateActiveStatusAsync(ids, false, It.IsAny<string>(), It.IsAny<CancellationToken>()))
		.ReturnsAsync(expectedCount);

		// Act
		ActionResult<int> result = await Controller.BulkDeactivateAsync(ids, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		int count = Assert.IsType<int>(okResult.Value);
		Assert.Equal(3, count);
	}

	#endregion
}
