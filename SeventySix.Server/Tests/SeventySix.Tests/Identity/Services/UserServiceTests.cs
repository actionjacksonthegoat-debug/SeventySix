// <copyright file="UserServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Tests.Identity;

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
	private readonly Mock<IValidator<CreateUserRequest>> MockCreateValidator;
	private readonly Mock<IValidator<UpdateUserRequest>> MockUpdateValidator;
	private readonly Mock<IValidator<UserQueryRequest>> MockQueryValidator;
	private readonly Mock<ILogger<UserService>> MockLogger;
	private readonly UserService Service;

	public UserServiceTests()
	{
		MockRepository = new Mock<IUserRepository>();
		MockCreateValidator = new Mock<IValidator<CreateUserRequest>>();
		MockUpdateValidator = new Mock<IValidator<UpdateUserRequest>>();
		MockQueryValidator = new Mock<IValidator<UserQueryRequest>>();
		MockLogger = new Mock<ILogger<UserService>>();
		Service = new UserService(
			MockRepository.Object,
			MockCreateValidator.Object,
			MockUpdateValidator.Object,
			MockQueryValidator.Object,
			MockLogger.Object);
	}

	#region Constructor Tests

	// Note: UserService uses primary constructor syntax which relies on
	// dependency injection to provide non-null dependencies.
	// ArgumentNullException tests are not applicable with this pattern.

	#endregion

	#region GetAllUsersAsync Tests

	[Fact]
	public async Task GetAllUsersAsync_ShouldReturnAllUsers_WhenUsersExistAsync()
	{
		// Arrange
		List<User> users =
		[
			new UserBuilder().WithUsername("user1").WithEmail("user1@example.com").WithIsActive(true).Build(),
			new UserBuilder().WithUsername("user2").WithEmail("user2@example.com").WithIsActive(false).Build(),
			new UserBuilder().WithUsername("user3").WithEmail("user3@example.com").WithIsActive(true).Build(),
		];

		MockRepository
			.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(users);

		// Act
		IEnumerable<UserDto> result = await Service.GetAllUsersAsync();

		// Assert
		Assert.NotNull(result);
		List<UserDto> userDtos = [.. result];
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
			.ReturnsAsync([]);

		// Act
		IEnumerable<UserDto> result = await Service.GetAllUsersAsync();

		// Assert
		Assert.NotNull(result);
		Assert.Empty(result);

		MockRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAllUsersAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		CancellationToken cancellationToken = new();
		MockRepository
			.Setup(r => r.GetAllAsync(cancellationToken))
			.ReturnsAsync([]);

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
		User user = new UserBuilder()
			.WithUsername("john_doe")
			.WithEmail("john@example.com")
			.WithFullName("John Doe")
			.WithIsActive(true)
			.Build();
		user.Id = 123;

		MockRepository
			.Setup(r => r.GetByIdAsync(123, It.IsAny<CancellationToken>()))
			.ReturnsAsync(user);

		// Act
		UserDto? result = await Service.GetUserByIdAsync(123);

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
		UserDto? result = await Service.GetUserByIdAsync(999);

		// Assert
		Assert.Null(result);

		MockRepository.Verify(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetUserByIdAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		CancellationToken cancellationToken = new();
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
		CreateUserRequest request = new()
		{
			Username = "new_user",
			Email = "new@example.com",
			FullName = "New User",
			IsActive = true,
		};

		MockCreateValidator.SetupSuccessfulValidation();

		MockRepository
			.Setup(r => r.UsernameExistsAsync(request.Username, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.EmailExistsAsync(request.Email, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>()))
			.ReturnsAsync((User u) =>
			{
				u.Id = 456; // Simulate DB assigning ID
				return u;
			});

		// Act
		UserDto result = await Service.CreateUserAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(456, result.Id);
		Assert.Equal("new_user", result.Username);
		Assert.Equal("new@example.com", result.Email);
		Assert.Equal("New User", result.FullName);
		Assert.True(result.IsActive);

		MockCreateValidator.Verify(
			v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), It.IsAny<CancellationToken>()),
			Times.Once);
		MockRepository.Verify(
			r => r.CreateAsync(It.Is<User>(u =>
				u.Username == "new_user" &&
				u.Email == "new@example.com" &&
				u.FullName == "New User" &&
				u.IsActive == true)),
			Times.Once);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldThrowValidationException_WhenRequestIsInvalidAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "ab", // Too short
			Email = "invalid-email",
		};

		ValidationFailure validationFailure = new("Username", "Username must be between 3 and 50 characters");
		ValidationResult validationResult = new(new[] { validationFailure });

		MockCreateValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(new ValidationException(validationResult.Errors));

		// Act & Assert
		await Assert.ThrowsAsync<ValidationException>(() =>
			Service.CreateUserAsync(request));

		MockCreateValidator.Verify(
			v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), It.IsAny<CancellationToken>()),
			Times.Once);
		MockRepository.Verify(
			r => r.CreateAsync(It.IsAny<User>()),
			Times.Never);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldSetCreatedAtToUtcNowAsync()
	{
		// Arrange
		DateTime beforeCreation = DateTime.UtcNow;
		CreateUserRequest request = new()
		{
			Username = "test_user",
			Email = "test@example.com",
		};

		ValidationResult validationResult = new();
		MockCreateValidator
			.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.UsernameExistsAsync(request.Username, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.EmailExistsAsync(request.Email, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		User? capturedUser = null;
		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>()))
			.ReturnsAsync((User u) =>
			{
				capturedUser = u;
				u.Id = 1;
				return u;
			});

		// Act
		await Service.CreateUserAsync(request);
		DateTime afterCreation = DateTime.UtcNow;

		// Assert
		Assert.NotNull(capturedUser);
		Assert.InRange(capturedUser.CreatedAt, beforeCreation, afterCreation);
		Assert.Equal(DateTimeKind.Utc, capturedUser.CreatedAt.Kind);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldHandleNullFullNameAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = null,
		};

		ValidationResult validationResult = new();
		MockCreateValidator
			.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.UsernameExistsAsync(request.Username, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.EmailExistsAsync(request.Email, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>()))
			.ReturnsAsync((User u) =>
			{
				u.Id = 1;
				return u;
			});

		// Act
		UserDto result = await Service.CreateUserAsync(request);

		// Assert
		Assert.Null(result.FullName);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldRespectIsActiveFalseAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "inactive_user",
			Email = "inactive@example.com",
			IsActive = false,
		};

		ValidationResult validationResult = new();
		MockCreateValidator
			.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.UsernameExistsAsync(request.Username, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.EmailExistsAsync(request.Email, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>()))
			.ReturnsAsync((User u) =>
			{
				u.Id = 1;
				return u;
			});

		// Act
		UserDto result = await Service.CreateUserAsync(request);

		// Assert
		Assert.False(result.IsActive);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		CancellationToken cancellationToken = new();
		CreateUserRequest request = new()
		{
			Username = "test",
			Email = "test@example.com",
		};

		ValidationResult validationResult = new();
		MockCreateValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), cancellationToken))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.UsernameExistsAsync(request.Username, null, cancellationToken))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.EmailExistsAsync(request.Email, null, cancellationToken))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.CreateAsync(It.IsAny<User>()))
			.ReturnsAsync((User u) =>
			{
				u.Id = 1;
				return u;
			});

		// Act
		await Service.CreateUserAsync(request);     // Assert
		MockCreateValidator.Verify(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateUserRequest>>(), cancellationToken), Times.Once);
		MockRepository.Verify(r => r.CreateAsync(It.IsAny<User>()), Times.Once);
	}

	#endregion

	#region UpdateUserAsync Tests

	[Fact]
	public async Task UpdateUserAsync_ValidRequest_ReturnsUpdatedUserDtoAsync()
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

		User existingUser = new User
		{
			Id = 1,
			Username = "olduser",
			Email = "old@example.com",
			FullName = "Old User",
			IsActive = true,
			CreatedAt = DateTime.UtcNow.AddDays(-1),
			CreatedBy = "System",
			IsDeleted = false,
			RowVersion = 1,
		};

		User updatedUser = new User
		{
			Id = 1,
			Username = request.Username,
			Email = request.Email,
			FullName = request.FullName,
			IsActive = request.IsActive,
			CreatedAt = existingUser.CreatedAt,
			CreatedBy = existingUser.CreatedBy,
			ModifiedAt = DateTime.UtcNow,
			ModifiedBy = "System",
			IsDeleted = false,
			RowVersion = 2,
		};

		ValidationResult validationResult = new();
		MockUpdateValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<UpdateUserRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.GetByIdAsync(request.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync(existingUser);

		MockRepository
			.Setup(r => r.UsernameExistsAsync(request.Username, request.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.EmailExistsAsync(request.Email, request.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.UpdateAsync(It.IsAny<User>()))
			.ReturnsAsync(updatedUser);

		// Act
		UserDto result = await Service.UpdateUserAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(updatedUser.Id, result.Id);
		Assert.Equal(updatedUser.Username, result.Username);
		Assert.Equal(updatedUser.Email, result.Email);
		Assert.Equal(updatedUser.FullName, result.FullName);

		MockRepository.Verify(r => r.UpdateAsync(
			It.Is<User>(u =>
				u.Username == request.Username &&
				u.Email == request.Email &&
				u.ModifiedBy == "System")), Times.Once);
	}

	[Fact]
	public async Task UpdateUserAsync_UserNotFound_ThrowsUserNotFoundExceptionAsync()
	{
		// Arrange
		UpdateUserRequest request = new UpdateUserRequest
		{
			Id = 999,
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			RowVersion = 1,
		};

		ValidationResult validationResult = new();
		MockUpdateValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<UpdateUserRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.GetByIdAsync(request.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync((User?)null);

		// Act & Assert
		UserNotFoundException exception = await Assert.ThrowsAsync<UserNotFoundException>(
			() => Service.UpdateUserAsync(request));

		Assert.Contains(request.Id.ToString(), exception.Message);

		MockRepository.Verify(r => r.UpdateAsync(
			It.IsAny<User>()), Times.Never);
	}

	[Fact]
	public async Task UpdateUserAsync_DuplicateUsername_ThrowsDuplicateUserExceptionAsync()
	{
		// Arrange
		UpdateUserRequest request = new UpdateUserRequest
		{
			Id = 1,
			Username = "duplicate",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			RowVersion = 1,
		};

		User existingUser = new User
		{
			Id = 1,
			Username = "olduser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			CreatedAt = DateTime.UtcNow.AddDays(-1),
			CreatedBy = "System",
			IsDeleted = false,
			RowVersion = 1,
		};

		ValidationResult validationResult = new();
		MockUpdateValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<UpdateUserRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.GetByIdAsync(request.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync(existingUser);

		MockRepository
			.Setup(r => r.UsernameExistsAsync(request.Username, request.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		// Act & Assert
		DuplicateUserException exception = await Assert.ThrowsAsync<DuplicateUserException>(
			() => Service.UpdateUserAsync(request));

		Assert.Contains(request.Username, exception.Message);

		MockRepository.Verify(r => r.UpdateAsync(
			It.IsAny<User>()), Times.Never);
	}

	[Fact]
	public async Task UpdateUserAsync_ConcurrencyConflict_ThrowsConcurrencyExceptionAsync()
	{
		// Arrange
		UpdateUserRequest request = new UpdateUserRequest
		{
			Id = 1,
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			RowVersion = 1,
		};

		User existingUser = new User
		{
			Id = 1,
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			CreatedAt = DateTime.UtcNow.AddDays(-1),
			CreatedBy = "System",
			IsDeleted = false,
			RowVersion = 1,
		};

		ValidationResult validationResult = new();
		MockUpdateValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<UpdateUserRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.GetByIdAsync(request.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync(existingUser);

		MockRepository
			.Setup(r => r.UpdateAsync(It.IsAny<User>()))
			.ThrowsAsync(new DbUpdateConcurrencyException());

		// Act & Assert
		ConcurrencyException exception = await Assert.ThrowsAsync<ConcurrencyException>(
			() => Service.UpdateUserAsync(request));

		Assert.Contains("modified by another user", exception.Message);
	}

	#endregion

	#region DeleteUserAsync and RestoreUserAsync Tests

	[Fact]
	public async Task DeleteUserAsync_ValidId_DeletesUserAsync()
	{
		// Arrange
		int userId = 1;
		string deletedBy = "Admin";

		MockRepository
			.Setup(r => r.SoftDeleteAsync(userId, deletedBy))
			.ReturnsAsync(true);

		// Act
		await Service.DeleteUserAsync(userId, deletedBy);

		// Assert
		MockRepository.Verify(r => r.SoftDeleteAsync(userId, deletedBy), Times.Once);
	}

	[Fact]
	public async Task RestoreUserAsync_ValidId_RestoresUserAsync()
	{
		// Arrange
		int userId = 1;

		MockRepository
			.Setup(r => r.RestoreAsync(userId))
			.ReturnsAsync(true);

		// Act
		await Service.RestoreUserAsync(userId);

		// Assert
		MockRepository.Verify(r => r.RestoreAsync(userId), Times.Once);
	}

	#endregion

	#region GetPagedUsersAsync Tests

	[Fact]
	public async Task GetPagedUsersAsync_ValidRequest_ReturnsPagedResultAsync()
	{
		// Arrange
		UserQueryRequest request = new UserQueryRequest
		{
			Page = 1,
			PageSize = 10,
			SearchTerm = "test",
			IsActive = true,
			IncludeDeleted = false,
		};

		List<User> users =
		[
			new User
			{
				Id = 1,
				Username = "testuser1",
				Email = "test1@example.com",
				FullName = "Test User 1",
				IsActive = true,
				CreatedAt = DateTime.UtcNow,
				CreatedBy = "System",
				IsDeleted = false,
				RowVersion = 1,
			},
			new User
			{
				Id = 2,
				Username = "testuser2",
				Email = "test2@example.com",
				FullName = "Test User 2",
				IsActive = true,
				CreatedAt = DateTime.UtcNow,
				CreatedBy = "System",
				IsDeleted = false,
				RowVersion = 1,
			},
		];

		int totalCount = 15;

		ValidationResult validationResult = new();
		MockQueryValidator
			.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<UserQueryRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		MockRepository
			.Setup(r => r.GetPagedAsync(
				request,
				It.IsAny<CancellationToken>()))
			.ReturnsAsync((users, totalCount));

		// Act
		PagedResult<UserDto> result = await Service.GetPagedUsersAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(2, result.Items.Count());
		Assert.Equal(1, result.Page);
		Assert.Equal(10, result.PageSize);
		Assert.Equal(15, result.TotalCount);
		Assert.Equal(2, result.TotalPages);
		Assert.False(result.HasPrevious);
		Assert.True(result.HasNext);
	}

	#endregion

	#region GetByUsername and GetByEmail Tests

	[Fact]
	public async Task GetByUsernameAsync_UserExists_ReturnsUserDtoAsync()
	{
		// Arrange
		string username = "testuser";

		User user = new User
		{
			Id = 1,
			Username = username,
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			CreatedAt = DateTime.UtcNow,
			CreatedBy = "System",
			IsDeleted = false,
			RowVersion = 1,
		};

		MockRepository
			.Setup(r => r.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
			.ReturnsAsync(user);

		// Act
		UserDto? result = await Service.GetByUsernameAsync(username);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(user.Id, result.Id);
		Assert.Equal(user.Username, result.Username);
		Assert.Equal(user.Email, result.Email);
	}

	[Fact]
	public async Task GetByUsernameAsync_UserNotFound_ReturnsNullAsync()
	{
		// Arrange
		string username = "nonexistent";

		MockRepository
			.Setup(r => r.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
			.ReturnsAsync((User?)null);

		// Act
		UserDto? result = await Service.GetByUsernameAsync(username);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task GetByEmailAsync_UserExists_ReturnsUserDtoAsync()
	{
		// Arrange
		string email = "test@example.com";

		User user = new User
		{
			Id = 1,
			Username = "testuser",
			Email = email,
			FullName = "Test User",
			IsActive = true,
			CreatedAt = DateTime.UtcNow,
			CreatedBy = "System",
			IsDeleted = false,
			RowVersion = 1,
		};

		MockRepository
			.Setup(r => r.GetByEmailAsync(email, It.IsAny<CancellationToken>()))
			.ReturnsAsync(user);

		// Act
		UserDto? result = await Service.GetByEmailAsync(email);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(user.Id, result.Id);
		Assert.Equal(user.Email, result.Email);
	}

	[Fact]
	public async Task GetByEmailAsync_UserNotFound_ReturnsNullAsync()
	{
		// Arrange
		string email = "nonexistent@example.com";

		MockRepository
			.Setup(r => r.GetByEmailAsync(email, It.IsAny<CancellationToken>()))
			.ReturnsAsync((User?)null);

		// Act
		UserDto? result = await Service.GetByEmailAsync(email);

		// Assert
		Assert.Null(result);
	}

	#endregion

	#region ExistsAsync Tests

	[Fact]
	public async Task UsernameExistsAsync_UsernameExists_ReturnsTrueAsync()
	{
		// Arrange
		string username = "testuser";

		MockRepository
			.Setup(r => r.UsernameExistsAsync(username, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		// Act
		bool result = await Service.UsernameExistsAsync(username);

		// Assert
		Assert.True(result);
	}

	[Fact]
	public async Task UsernameExistsAsync_UsernameNotFound_ReturnsFalseAsync()
	{
		// Arrange
		string username = "newuser";

		MockRepository
			.Setup(r => r.UsernameExistsAsync(username, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		// Act
		bool result = await Service.UsernameExistsAsync(username);

		// Assert
		Assert.False(result);
	}

	[Fact]
	public async Task EmailExistsAsync_EmailExists_ReturnsTrueAsync()
	{
		// Arrange
		string email = "test@example.com";

		MockRepository
			.Setup(r => r.EmailExistsAsync(email, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		// Act
		bool result = await Service.EmailExistsAsync(email);

		// Assert
		Assert.True(result);
	}

	[Fact]
	public async Task EmailExistsAsync_EmailNotFound_ReturnsFalseAsync()
	{
		// Arrange
		string email = "new@example.com";

		MockRepository
			.Setup(r => r.EmailExistsAsync(email, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		// Act
		bool result = await Service.EmailExistsAsync(email);

		// Assert
		Assert.False(result);
	}

	#endregion

	#region BulkUpdateActiveStatusAsync Tests

	[Fact]
	public async Task BulkUpdateActiveStatusAsync_ValidRequest_UpdatesUsersAsync()
	{
		// Arrange
		List<int> userIds = [1, 2, 3];
		bool isActive = false;
		string modifiedBy = "Admin";
		int expectedCount = 3;

		MockRepository
			.Setup(r => r.BulkUpdateActiveStatusAsync(userIds, isActive))
			.ReturnsAsync(expectedCount);

		// Act
		int result = await Service.BulkUpdateActiveStatusAsync(userIds, isActive, modifiedBy);

		// Assert
		Assert.Equal(expectedCount, result);

		MockRepository.Verify(r => r.BulkUpdateActiveStatusAsync(
			userIds,
			isActive), Times.Once);
	}

	#endregion
}


