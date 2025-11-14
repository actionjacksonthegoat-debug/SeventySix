// <copyright file="UserControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Api.Controllers;
using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for UserController.
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
public class UserControllerTests
{
	private readonly Mock<IUserService> MockUserService;
	private readonly Mock<ILogger<UserController>> MockLogger;
	private readonly UserController Controller;

	public UserControllerTests()
	{
		MockUserService = new Mock<IUserService>();
		MockLogger = new Mock<ILogger<UserController>>();
		Controller = new UserController(MockUserService.Object, MockLogger.Object);
	}

	#region Constructor Tests

	// Note: UserController uses primary constructor syntax which relies on
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
}