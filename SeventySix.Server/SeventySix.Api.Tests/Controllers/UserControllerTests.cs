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

	[Fact]
	public void Constructor_ShouldThrowArgumentNullException_WhenUserServiceIsNull()
	{
		// Arrange, Act & Assert
		Assert.Throws<ArgumentNullException>(() =>
			new UserController(null!, MockLogger.Object));
	}

	[Fact]
	public void Constructor_ShouldThrowArgumentNullException_WhenLoggerIsNull()
	{
		// Arrange, Act & Assert
		Assert.Throws<ArgumentNullException>(() =>
			new UserController(MockUserService.Object, null!));
	}

	#endregion

	#region GetAllAsync Tests

	[Fact]
	public async Task GetAllAsync_ShouldReturnOkWithUsers_WhenUsersExistAsync()
	{
		// Arrange
		var users = new List<UserDto>
		{
			new UserDto { Id = 1, Username = "user1", Email = "user1@example.com", IsActive = true },
			new UserDto { Id = 2, Username = "user2", Email = "user2@example.com", IsActive = false },
		};

		MockUserService
			.Setup(s => s.GetAllUsersAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(users);

		// Act
		var result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		var okResult = Assert.IsType<OkObjectResult>(result.Result);
		var returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
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
		var result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		var okResult = Assert.IsType<OkObjectResult>(result.Result);
		var returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
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
		var userDto = new UserDto
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
		var result = await Controller.GetByIdAsync(123, CancellationToken.None);

		// Assert
		var okResult = Assert.IsType<OkObjectResult>(result.Result);
		var returnedUser = Assert.IsType<UserDto>(okResult.Value);
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
		var result = await Controller.GetByIdAsync(999, CancellationToken.None);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task GetByIdAsync_ShouldLogInformation_WhenUserIsRequestedAsync()
	{
		// Arrange
		MockUserService
			.Setup(s => s.GetUserByIdAsync(123, It.IsAny<CancellationToken>()))
			.ReturnsAsync((UserDto?)null);

		// Act
		await Controller.GetByIdAsync(123, CancellationToken.None);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting user with ID: 123")),
				null,
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task GetByIdAsync_ShouldLogWarning_WhenUserNotFoundAsync()
	{
		// Arrange
		MockUserService
			.Setup(s => s.GetUserByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((UserDto?)null);

		// Act
		await Controller.GetByIdAsync(999, CancellationToken.None);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Warning,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("User with ID 999 not found")),
				null,
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	#endregion

	#region CreateAsync Tests

	[Fact]
	public async Task CreateAsync_ShouldReturnCreatedAtRoute_WhenUserIsCreatedAsync()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "new_user",
			Email = "new@example.com",
			FullName = "New User",
			IsActive = true,
		};

		var createdUser = new UserDto
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
		var result = await Controller.CreateAsync(request, CancellationToken.None);

		// Assert
		var createdResult = Assert.IsType<CreatedAtRouteResult>(result.Result);
		Assert.Equal("GetUserById", createdResult.RouteName);
		Assert.Equal(456, createdResult.RouteValues!["id"]);

		var returnedUser = Assert.IsType<UserDto>(createdResult.Value);
		Assert.Equal(456, returnedUser.Id);
		Assert.Equal("new_user", returnedUser.Username);
	}

	[Fact]
	public async Task CreateAsync_ShouldLogInformation_WhenUserIsCreatedAsync()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "test_user",
			Email = "test@example.com",
		};

		var createdUser = new UserDto
		{
			Id = 1,
			Username = "test_user",
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
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Creating new user with username: test_user")),
				null,
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task CreateAsync_ShouldCallServiceWithCorrectRequestAsync()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "test",
			Email = "test@example.com",
		};

		var createdUser = new UserDto
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