// <copyright file="UserServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using Moq;
using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;
using SeventySix.Application.Services;
using SeventySix.Domain.Entities;
using SeventySix.Domain.Interfaces;

namespace SeventySix.Application.Tests.Services;

/// <summary>
/// Unit tests for UserService.
/// Tests business logic and service orchestration.
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Use mocks for dependencies (repository, validator)
/// - Test each public method
/// - Test success and failure scenarios
/// - Verify proper service orchestration
///
/// Coverage Focus:
/// - GetAllUsersAsync
/// - GetUserByIdAsync
/// - CreateUserAsync
/// - Validation integration
/// - Repository interaction
/// - DTO mapping
/// </remarks>
public class UserServiceTests
{
	private readonly Mock<IUserRepository> MockRepository;
	private readonly Mock<IValidator<CreateUserRequest>> MockValidator;
	private readonly UserService Service;

	public UserServiceTests()
	{
		MockRepository = new Mock<IUserRepository>();
		MockValidator = new Mock<IValidator<CreateUserRequest>>();
		Service = new UserService(MockRepository.Object, MockValidator.Object);
	}

	#region Constructor Tests

	[Fact]
	public void Constructor_ShouldThrowArgumentNullException_WhenRepositoryIsNull()
	{
		// Arrange, Act & Assert
		Assert.Throws<ArgumentNullException>(() =>
			new UserService(null!, MockValidator.Object));
	}

	[Fact]
	public void Constructor_ShouldThrowArgumentNullException_WhenValidatorIsNull()
	{
		// Arrange, Act & Assert
		Assert.Throws<ArgumentNullException>(() =>
			new UserService(MockRepository.Object, null!));
	}

	#endregion

	#region GetAllUsersAsync Tests

	[Fact]
	public async Task GetAllUsersAsync_ShouldReturnAllUsers_WhenUsersExistAsync()
	{
		// Arrange
		var users = new List<User>
		{
			new User { Id = 1, Username = "user1", Email = "user1@example.com", IsActive = true },
			new User { Id = 2, Username = "user2", Email = "user2@example.com", IsActive = false },
			new User { Id = 3, Username = "user3", Email = "user3@example.com", IsActive = true },
		};

		MockRepository
			.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(users);

		// Act
		var result = await Service.GetAllUsersAsync();

		// Assert
		Assert.NotNull(result);
		var userDtos = result.ToList();
		Assert.Equal(3, userDtos.Count);
		Assert.Equal("user1", userDtos[0].Username);
		Assert.Equal("user2", userDtos[1].Username);
		Assert.Equal("user3", userDtos[2].Username);

		MockRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAllUsersAsync_ShouldReturnEmptyCollection_WhenNoUsersExistAsync()
	{
		// Arrange
		MockRepository
			.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<User>());

		// Act
		var result = await Service.GetAllUsersAsync();

		// Assert
		Assert.NotNull(result);
		Assert.Empty(result);

		MockRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAllUsersAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		var cancellationToken = new CancellationToken();
		MockRepository
			.Setup(r => r.GetAllAsync(cancellationToken))
			.ReturnsAsync(new List<User>());

		// Act
		await Service.GetAllUsersAsync(cancellationToken);

		// Assert
		MockRepository.Verify(r => r.GetAllAsync(cancellationToken), Times.Once);
	}

	#endregion

	#region GetUserByIdAsync Tests

	[Fact]
	public async Task GetUserByIdAsync_ShouldReturnUser_WhenUserExistsAsync()
	{
		// Arrange
		var user = new User
		{
			Id = 123,
			Username = "john_doe",
			Email = "john@example.com",
			FullName = "John Doe",
			IsActive = true,
		};

		MockRepository
			.Setup(r => r.GetByIdAsync(123, It.IsAny<CancellationToken>()))
			.ReturnsAsync(user);

		// Act
		var result = await Service.GetUserByIdAsync(123);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(123, result.Id);
		Assert.Equal("john_doe", result.Username);
		Assert.Equal("john@example.com", result.Email);
		Assert.Equal("John Doe", result.FullName);
		Assert.True(result.IsActive);

		MockRepository.Verify(r => r.GetByIdAsync(123, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetUserByIdAsync_ShouldReturnNull_WhenUserDoesNotExistAsync()
	{
		// Arrange
		MockRepository
			.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((User?)null);

		// Act
		var result = await Service.GetUserByIdAsync(999);

		// Assert
		Assert.Null(result);

		MockRepository.Verify(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetUserByIdAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		var cancellationToken = new CancellationToken();
		MockRepository
			.Setup(r => r.GetByIdAsync(1, cancellationToken))
			.ReturnsAsync((User?)null);

		// Act
		await Service.GetUserByIdAsync(1, cancellationToken);

		// Assert
		MockRepository.Verify(r => r.GetByIdAsync(1, cancellationToken), Times.Once);
	}

	#endregion

	#region CreateUserAsync Tests

	[Fact]
	public async Task CreateUserAsync_ShouldCreateUser_WhenRequestIsValidAsync()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "new_user",
			Email = "new@example.com",
			FullName = "New User",
			IsActive = true,
		};

		var validationResult = new ValidationResult();
		MockValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((User u, CancellationToken ct) =>
			{
				u.Id = 456; // Simulate DB assigning ID
				return u;
			});

		// Act
		var result = await Service.CreateUserAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(456, result.Id);
		Assert.Equal("new_user", result.Username);
		Assert.Equal("new@example.com", result.Email);
		Assert.Equal("New User", result.FullName);
		Assert.True(result.IsActive);

		MockValidator.Verify(
			v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), It.IsAny<CancellationToken>()),
			Times.Once);
		MockRepository.Verify(
			r => r.CreateAsync(It.Is<User>(u =>
				u.Username == "new_user" &&
				u.Email == "new@example.com" &&
				u.FullName == "New User" &&
				u.IsActive == true),
				It.IsAny<CancellationToken>()),
			Times.Once);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldThrowValidationException_WhenRequestIsInvalidAsync()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "ab", // Too short
			Email = "invalid-email",
		};

		var validationFailure = new ValidationFailure("Username", "Username must be between 3 and 50 characters");
		var validationResult = new ValidationResult(new[] { validationFailure });

		MockValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(new ValidationException(validationResult.Errors));

		// Act & Assert
		await Assert.ThrowsAsync<ValidationException>(() =>
			Service.CreateUserAsync(request));

		MockValidator.Verify(
			v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), It.IsAny<CancellationToken>()),
			Times.Once);
		MockRepository.Verify(
			r => r.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
			Times.Never);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldSetCreatedAtToUtcNowAsync()
	{
		// Arrange
		var beforeCreation = DateTime.UtcNow;
		var request = new CreateUserRequest
		{
			Username = "test_user",
			Email = "test@example.com",
		};

		var validationResult = new ValidationResult();
		MockValidator
			.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		User? capturedUser = null;
		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((User u, CancellationToken ct) =>
			{
				capturedUser = u;
				u.Id = 1;
				return u;
			});

		// Act
		await Service.CreateUserAsync(request);
		var afterCreation = DateTime.UtcNow;

		// Assert
		Assert.NotNull(capturedUser);
		Assert.InRange(capturedUser.CreatedAt, beforeCreation, afterCreation);
		Assert.Equal(DateTimeKind.Utc, capturedUser.CreatedAt.Kind);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldHandleNullFullNameAsync()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = null,
		};

		var validationResult = new ValidationResult();
		MockValidator
			.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((User u, CancellationToken ct) =>
			{
				u.Id = 1;
				return u;
			});

		// Act
		var result = await Service.CreateUserAsync(request);

		// Assert
		Assert.Null(result.FullName);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldRespectIsActiveFalseAsync()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "inactive_user",
			Email = "inactive@example.com",
			IsActive = false,
		};

		var validationResult = new ValidationResult();
		MockValidator
			.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync((User u, CancellationToken ct) =>
			{
				u.Id = 1;
				return u;
			});

		// Act
		var result = await Service.CreateUserAsync(request);

		// Assert
		Assert.False(result.IsActive);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		var cancellationToken = new CancellationToken();
		var request = new CreateUserRequest
		{
			Username = "test",
			Email = "test@example.com",
		};

		var validationResult = new ValidationResult();
		MockValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), cancellationToken))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>(), cancellationToken))
			.ReturnsAsync((User u, CancellationToken ct) =>
			{
				u.Id = 1;
				return u;
			});

		// Act
		await Service.CreateUserAsync(request, cancellationToken);

		// Assert
		MockValidator.Verify(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), cancellationToken), Times.Once);
		MockRepository.Verify(r => r.CreateAsync(It.IsAny<User>(), cancellationToken), Times.Once);
	}

	#endregion
}
