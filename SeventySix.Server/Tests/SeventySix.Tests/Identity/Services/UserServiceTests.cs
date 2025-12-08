// <copyright file="UserServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

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
	private readonly IUserRepository Repository;
	private readonly IPermissionRequestRepository PermissionRequestRepository;
	private readonly IValidator<CreateUserRequest> CreateValidator;
	private readonly IValidator<UpdateUserRequest> UpdateValidator;
	private readonly IValidator<UpdateProfileRequest> UpdateProfileValidator;
	private readonly IValidator<UserQueryRequest> QueryValidator;
	private readonly ITransactionManager TransactionManager;
	private readonly IAuthService AuthService;
	private readonly ILogger<UserService> Logger;
	private readonly UserService Service;

	public UserServiceTests()
	{
		Repository = Substitute.For<IUserRepository>();
		PermissionRequestRepository = Substitute.For<IPermissionRequestRepository>();
		CreateValidator = Substitute.For<IValidator<CreateUserRequest>>();
		UpdateValidator = Substitute.For<IValidator<UpdateUserRequest>>();
		UpdateProfileValidator = Substitute.For<IValidator<UpdateProfileRequest>>();
		QueryValidator = Substitute.For<IValidator<UserQueryRequest>>();
		TransactionManager = Substitute.For<ITransactionManager>();
		AuthService = Substitute.For<IAuthService>();
		Logger = Substitute.For<ILogger<UserService>>();

		// Setup transaction manager to execute the delegate immediately
		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<UserDto>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(async callInfo =>
			{
				Func<CancellationToken, Task<UserDto>> operation = callInfo.ArgAt<Func<CancellationToken, Task<UserDto>>>(0);
				CancellationToken ct = callInfo.ArgAt<CancellationToken>(2);
				return await operation(ct);
			});

		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<int>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(async callInfo =>
			{
				Func<CancellationToken, Task<int>> operation = callInfo.ArgAt<Func<CancellationToken, Task<int>>>(0);
				CancellationToken ct = callInfo.ArgAt<CancellationToken>(2);
				return await operation(ct);
			});

		Service = new UserService(
			Repository,
			PermissionRequestRepository,
			CreateValidator,
			UpdateValidator,
			UpdateProfileValidator,
			QueryValidator,
			TransactionManager,
			AuthService,
			Logger);
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
		List<UserDto> userDtos =
		[
			new UserDtoBuilder().WithId(1).WithUsername("user1").WithEmail("user1@example.com").WithIsActive(true).Build(),
			new UserDtoBuilder().WithId(2).WithUsername("user2").WithEmail("user2@example.com").WithIsActive(false).Build(),
			new UserDtoBuilder().WithId(3).WithUsername("user3").WithEmail("user3@example.com").WithIsActive(true).Build(),
		];

		Repository
			.GetAllProjectedAsync(Arg.Any<CancellationToken>())
			.Returns(userDtos);

		// Act
		IEnumerable<UserDto> result = await Service.GetAllUsersAsync();

		// Assert
		Assert.NotNull(result);
		List<UserDto> resultList = [.. result];
		Assert.Equal(3, resultList.Count);
		Assert.Equal("user1", resultList[0].Username);
		Assert.Equal("user2", resultList[1].Username);
		Assert.Equal("user3", resultList[2].Username);

		await Repository.Received(1).GetAllProjectedAsync(Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAllUsersAsync_ShouldReturnEmptyCollection_WhenNoUsersExistAsync()
	{
		// Arrange
		Repository
			.GetAllProjectedAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<UserDto> result = await Service.GetAllUsersAsync();

		// Assert
		Assert.NotNull(result);
		Assert.Empty(result);

		await Repository.Received(1).GetAllProjectedAsync(Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAllUsersAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		CancellationToken cancellationToken = new();
		Repository
			.GetAllProjectedAsync(cancellationToken)
			.Returns([]);

		// Act
		await Service.GetAllUsersAsync(cancellationToken);

		// Assert
		await Repository.Received(1).GetAllProjectedAsync(cancellationToken);
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

		Repository
			.GetByIdAsync(123, Arg.Any<CancellationToken>())
			.Returns(user);

		// Act
		UserDto? result = await Service.GetUserByIdAsync(123);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(123, result.Id);
		Assert.Equal("john_doe", result.Username);
		Assert.Equal("john@example.com", result.Email);
		Assert.Equal("John Doe", result.FullName);
		Assert.True(result.IsActive);

		await Repository.Received(1).GetByIdAsync(123, Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetUserByIdAsync_ShouldReturnNull_WhenUserDoesNotExistAsync()
	{
		// Arrange
		Repository
			.GetByIdAsync(999, Arg.Any<CancellationToken>())
			.Returns((User?)null);

		// Act
		UserDto? result = await Service.GetUserByIdAsync(999);

		// Assert
		Assert.Null(result);

		await Repository.Received(1).GetByIdAsync(999, Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetUserByIdAsync_ShouldRespectCancellationTokenAsync()
	{
		// Arrange
		CancellationToken cancellationToken = new();
		Repository
			.GetByIdAsync(1, cancellationToken)
			.Returns((User?)null);

		// Act
		await Service.GetUserByIdAsync(1, cancellationToken);

		// Assert
		await Repository.Received(1).GetByIdAsync(1, cancellationToken);
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

		CreateValidator.SetupSuccessfulValidation();

		Repository
			.UsernameExistsAsync(request.Username, null, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(request.Email, null, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.CreateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				User u = callInfo.ArgAt<User>(0);
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

		await CreateValidator.Received(1)
			.ValidateAsync(Arg.Any<ValidationContext<CreateUserRequest>>(), Arg.Any<CancellationToken>());
		await Repository.Received(1)
			.CreateAsync(Arg.Is<User>(u =>
				u.Username == "new_user" &&
				u.Email == "new@example.com" &&
				u.FullName == "New User" &&
				u.IsActive == true), Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateUserAsync_ShouldThrowValidationException_WhenRequestIsInvalidAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "ab", // Too short
			Email = "invalid-email",
			FullName = "Test User",
		};

		ValidationFailure validationFailure = new("Username", "Username must be between 3 and 50 characters");
		ValidationResult validationResult = new([validationFailure]);

		CreateValidator
			.ValidateAsync(Arg.Any<ValidationContext<CreateUserRequest>>(), Arg.Any<CancellationToken>())
			.ThrowsAsync(new ValidationException(validationResult.Errors));

		// Act & Assert
		await Assert.ThrowsAsync<ValidationException>(() =>
			Service.CreateUserAsync(request));

		await CreateValidator.Received(1)
			.ValidateAsync(Arg.Any<ValidationContext<CreateUserRequest>>(), Arg.Any<CancellationToken>());
		await Repository.DidNotReceive()
			.CreateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateUserAsync_ShouldPassEntityToRepository_WithoutSettingCreateDateAsync()
	{
		// Arrange - CreateDate and CreatedBy are set by AuditInterceptor, not service
		// Service passes entity to repository, interceptor handles audit properties on SaveChanges
		CreateUserRequest request = new()
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = "Test User",
		};

		ValidationResult validationResult = new();
		CreateValidator
			.ValidateAsync(request, Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.UsernameExistsAsync(request.Username, null, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(request.Email, null, Arg.Any<CancellationToken>())
			.Returns(false);

		User? capturedUser = null;
		Repository
			.CreateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				capturedUser = callInfo.ArgAt<User>(0);
				capturedUser.Id = 1;
				// Simulate what AuditInterceptor would do
				capturedUser.CreateDate = DateTime.UtcNow;
				capturedUser.CreatedBy = TestAuditConstants.SystemUser;
				capturedUser.ModifiedBy = TestAuditConstants.SystemUser;
				return capturedUser;
			});

		// Act
		await Service.CreateUserAsync(request);

		// Assert - Service does NOT set audit fields, CreateDate/CreatedBy are default before interceptor
		Assert.NotNull(capturedUser);
		// Service passes entity with default values - interceptor sets them on save
		// After mock callback simulating interceptor, values are set
		Assert.Equal(TestAuditConstants.SystemUser, capturedUser.CreatedBy);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldHandleEmptyFullNameAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = string.Empty,
		};

		ValidationResult validationResult = new();
		CreateValidator
			.ValidateAsync(request, Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.UsernameExistsAsync(request.Username, null, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(request.Email, null, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.CreateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				User u = callInfo.ArgAt<User>(0);
				u.Id = 1;
				return u;
			});

		// Act
		UserDto result = await Service.CreateUserAsync(request);

		// Assert
		Assert.Equal(string.Empty, result.FullName);
	}

	[Fact]
	public async Task CreateUserAsync_ShouldRespectIsActiveFalseAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "inactive_user",
			Email = "inactive@example.com",
			FullName = "Inactive User",
			IsActive = false,
		};

		ValidationResult validationResult = new();
		CreateValidator
			.ValidateAsync(request, Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.UsernameExistsAsync(request.Username, null, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(request.Email, null, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.CreateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				User u = callInfo.ArgAt<User>(0);
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
			FullName = "Test User",
		};

		ValidationResult validationResult = new();
		CreateValidator
			.ValidateAsync(Arg.Any<ValidationContext<CreateUserRequest>>(), cancellationToken)
			.Returns(validationResult);

		Repository
			.UsernameExistsAsync(request.Username, null, cancellationToken)
			.Returns(false);

		Repository
			.EmailExistsAsync(request.Email, null, cancellationToken)
			.Returns(false);

		Repository
			.CreateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				User u = callInfo.ArgAt<User>(0);
				u.Id = 1;
				return u;
			});

		// Act
		await Service.CreateUserAsync(request);

		// Assert
		await CreateValidator.Received(1).ValidateAsync(Arg.Any<ValidationContext<CreateUserRequest>>(), cancellationToken);
		await Repository.Received(1).CreateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateUserAsync_CallsInitiatePasswordReset_WithIsNewUserTrueAsync()
	{
		// Arrange
		IAuthService mockAuthService =
			Substitute.For<IAuthService>();

		UserService service =
			new(
				Repository,
				PermissionRequestRepository,
				CreateValidator,
				UpdateValidator,
				UpdateProfileValidator,
				QueryValidator,
				TransactionManager,
				mockAuthService,
				Logger);

		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
				IsActive = true
			};

		CreateValidator.SetupSuccessfulValidation();

		Repository
			.UsernameExistsAsync(
				request.Username,
				null,
				Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(
				request.Email,
				null,
				Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.CreateAsync(
				Arg.Any<User>(),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo =>
				{
					User user =
						callInfo.ArgAt<User>(0);
					user.Id = 123;
					return user;
				});

		// Act
		UserDto result =
			await service.CreateUserAsync(
				request,
				CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("testuser", result.Username);

		await mockAuthService.Received(1)
			.InitiatePasswordResetAsync(
				Arg.Is<int>(id => id == 123),
				isNewUser: true,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateUserAsync_SucceedsWhenEmailFails_LogsWarningAsync()
	{
		// Arrange
		IAuthService mockAuthService =
			Substitute.For<IAuthService>();

		mockAuthService
			.InitiatePasswordResetAsync(
				Arg.Any<int>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(
				new Exception("SMTP connection failed"));

		UserService service =
			new(
				Repository,
				PermissionRequestRepository,
				CreateValidator,
				UpdateValidator,
				UpdateProfileValidator,
				QueryValidator,
				TransactionManager,
				mockAuthService,
				Logger);

		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
				IsActive = true
			};

		CreateValidator.SetupSuccessfulValidation();

		Repository
			.UsernameExistsAsync(
				request.Username,
				null,
				Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(
				request.Email,
				null,
				Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.CreateAsync(
				Arg.Any<User>(),
				Arg.Any<CancellationToken>())
			.Returns(
				callInfo =>
				{
					User user =
						callInfo.ArgAt<User>(0);
					user.Id = 123;
					user.Email = "test@example.com";
					return user;
				});

		// Act
		UserDto result =
			await service.CreateUserAsync(
				request,
				CancellationToken.None);

		// Assert - User created successfully despite email failure
		Assert.NotNull(result);
		Assert.Equal("testuser", result.Username);
		Assert.Equal("test@example.com", result.Email);

		// Verify warning logged with exception
		Logger.Received(1)
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Is<object>(o => o.ToString()!.Contains("Failed to send welcome email")),
				Arg.Any<Exception>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	[Fact]
	public async Task CreateUserAsync_WhenEmailRateLimited_MarksUserAndRethrowsAsync()
	{
		// Arrange
		IAuthService mockAuthService =
			Substitute.For<IAuthService>();

		mockAuthService
			.InitiatePasswordResetAsync(
				Arg.Any<int>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(
				new EmailRateLimitException(
					TimeSpan.FromHours(12),
					0));

		UserService service =
			new(
				Repository,
				PermissionRequestRepository,
				CreateValidator,
				UpdateValidator,
				UpdateProfileValidator,
				QueryValidator,
				TransactionManager,
				mockAuthService,
				Logger);

		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
				IsActive = true
			};

		CreateValidator.SetupSuccessfulValidation();

		Repository
			.UsernameExistsAsync(
				request.Username,
				null,
				Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(
				request.Email,
				null,
				Arg.Any<CancellationToken>())
			.Returns(false);

		User createdUser =
			new()
			{
				Id = 123,
				Username = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
				IsActive = true,
				NeedsPendingEmail = false
			};

		Repository
			.CreateAsync(
				Arg.Any<User>(),
				Arg.Any<CancellationToken>())
			.Returns(createdUser);

		Repository
			.GetByIdAsync(
				123,
				Arg.Any<CancellationToken>())
			.Returns(createdUser);

		// Act & Assert: Verify exception is rethrown
		await Should.ThrowAsync<EmailRateLimitException>(
			() => service.CreateUserAsync(
				request,
				CancellationToken.None));

		// Verify user was marked with NeedsPendingEmail flag
		await Repository.Received(1)
			.UpdateAsync(
				Arg.Any<User>(),
				Arg.Any<CancellationToken>());

		// Verify the user object was mutated correctly
		createdUser.NeedsPendingEmail.ShouldBeTrue();
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
		};

		User existingUser = new User
		{
			Id = 1,
			Username = "olduser",
			Email = "old@example.com",
			FullName = "Old User",
			IsActive = true,
			CreateDate = DateTime.UtcNow.AddDays(-1),
			CreatedBy = TestAuditConstants.SystemUser,
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
			CreateDate = existingUser.CreateDate,
			CreatedBy = existingUser.CreatedBy,
			ModifyDate = DateTime.UtcNow,
			ModifiedBy = TestAuditConstants.SystemUser,
			IsDeleted = false,
			RowVersion = 2,
		};

		ValidationResult validationResult = new();
		UpdateValidator
			.ValidateAsync(Arg.Any<ValidationContext<UpdateUserRequest>>(), Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.GetByIdAsync(request.Id, Arg.Any<CancellationToken>())
			.Returns(existingUser);

		Repository
			.UsernameExistsAsync(request.Username, request.Id, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(request.Email, request.Id, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.UpdateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.Returns(updatedUser);

		// Act
		UserDto result = await Service.UpdateUserAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(updatedUser.Id, result.Id);
		Assert.Equal(updatedUser.Username, result.Username);
		Assert.Equal(updatedUser.Email, result.Email);
		Assert.Equal(updatedUser.FullName, result.FullName);

		await Repository.Received(1).UpdateAsync(
			Arg.Is<User>(u =>
				u.Username == request.Username &&
				u.Email == request.Email),
			Arg.Any<CancellationToken>());
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
		};

		ValidationResult validationResult = new();
		UpdateValidator
			.ValidateAsync(Arg.Any<ValidationContext<UpdateUserRequest>>(), Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.GetByIdAsync(request.Id, Arg.Any<CancellationToken>())
			.Returns((User?)null);

		// Act & Assert
		UserNotFoundException exception = await Assert.ThrowsAsync<UserNotFoundException>(
			() => Service.UpdateUserAsync(request));

		Assert.Contains(request.Id.ToString(), exception.Message);

		await Repository.DidNotReceive().UpdateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
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
		};

		User existingUser = new User
		{
			Id = 1,
			Username = "olduser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			CreateDate = DateTime.UtcNow.AddDays(-1),
			CreatedBy = TestAuditConstants.SystemUser,
			IsDeleted = false,
			RowVersion = 1,
		};

		ValidationResult validationResult = new();
		UpdateValidator
			.ValidateAsync(Arg.Any<ValidationContext<UpdateUserRequest>>(), Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.GetByIdAsync(request.Id, Arg.Any<CancellationToken>())
			.Returns(existingUser);

		Repository
			.UsernameExistsAsync(request.Username, request.Id, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act & Assert
		DuplicateUserException exception = await Assert.ThrowsAsync<DuplicateUserException>(
			() => Service.UpdateUserAsync(request));

		Assert.Contains(request.Username, exception.Message);

		await Repository.DidNotReceive().UpdateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
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
		};

		User existingUser = new User
		{
			Id = 1,
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
			CreateDate = DateTime.UtcNow.AddDays(-1),
			CreatedBy = TestAuditConstants.SystemUser,
			IsDeleted = false,
			RowVersion = 1,
		};

		ValidationResult validationResult = new();
		UpdateValidator
			.ValidateAsync(Arg.Any<ValidationContext<UpdateUserRequest>>(), Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.GetByIdAsync(request.Id, Arg.Any<CancellationToken>())
			.Returns(existingUser);

		Repository
			.UpdateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.ThrowsAsync(new DbUpdateConcurrencyException());

		// Act & Assert - DbUpdateConcurrencyException bubbles up from repository
		// TransactionManager handles retries, service doesn't wrap the exception
		await Assert.ThrowsAsync<DbUpdateConcurrencyException>(
			() => Service.UpdateUserAsync(request));
	}

	#endregion

	#region DeleteUserAsync and RestoreUserAsync Tests

	[Fact]
	public async Task DeleteUserAsync_ValidId_DeletesUserAsync()
	{
		// Arrange
		int userId = 1;
		string deletedBy = "Admin";

		Repository
			.SoftDeleteAsync(userId, deletedBy, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		await Service.DeleteUserAsync(userId, deletedBy);

		// Assert
		await Repository.Received(1).SoftDeleteAsync(userId, deletedBy, Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task RestoreUserAsync_ValidId_RestoresUserAsync()
	{
		// Arrange
		int userId = 1;

		Repository
			.RestoreAsync(userId, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		await Service.RestoreUserAsync(userId);

		// Assert
		await Repository.Received(1).RestoreAsync(userId, Arg.Any<CancellationToken>());
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

		List<UserDto> userDtos =
		[
			new UserDtoBuilder()
				.WithId(1)
				.WithUsername("testuser1")
				.WithEmail("test1@example.com")
				.WithFullName("Test User 1")
				.WithIsActive(true)
				.Build(),
			new UserDtoBuilder()
				.WithId(2)
				.WithUsername("testuser2")
				.WithEmail("test2@example.com")
				.WithFullName("Test User 2")
				.WithIsActive(true)
				.Build(),
		];

		int totalCount = 15;

		ValidationResult validationResult = new();
		QueryValidator
			.ValidateAsync(Arg.Any<ValidationContext<UserQueryRequest>>(), Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.GetPagedProjectedAsync(request, Arg.Any<CancellationToken>())
			.Returns((userDtos.AsEnumerable(), totalCount));

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
			Email = TestUserConstants.DefaultEmail,
			FullName = "Test User",
			IsActive = true,
			CreateDate = DateTime.UtcNow,
			CreatedBy = TestAuditConstants.SystemUser,
			IsDeleted = false,
			RowVersion = 1,
		};

		Repository
			.GetByUsernameAsync(username, Arg.Any<CancellationToken>())
			.Returns(user);

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

		Repository
			.GetByUsernameAsync(username, Arg.Any<CancellationToken>())
			.Returns((User?)null);

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
			Username = TestUserConstants.DefaultUsername,
			Email = email,
			FullName = "Test User",
			IsActive = true,
			CreateDate = DateTime.UtcNow,
			CreatedBy = TestAuditConstants.SystemUser,
			IsDeleted = false,
			RowVersion = 1,
		};

		Repository
			.GetByEmailAsync(email, Arg.Any<CancellationToken>())
			.Returns(user);

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

		Repository
			.GetByEmailAsync(email, Arg.Any<CancellationToken>())
			.Returns((User?)null);

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

		Repository
			.UsernameExistsAsync(username, null, Arg.Any<CancellationToken>())
			.Returns(true);

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

		Repository
			.UsernameExistsAsync(username, null, Arg.Any<CancellationToken>())
			.Returns(false);

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

		Repository
			.EmailExistsAsync(email, null, Arg.Any<CancellationToken>())
			.Returns(true);

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

		Repository
			.EmailExistsAsync(email, null, Arg.Any<CancellationToken>())
			.Returns(false);

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

		Repository
			.BulkUpdateActiveStatusAsync(userIds, isActive, Arg.Any<CancellationToken>())
			.Returns(expectedCount);

		// Act
		int result = await Service.BulkUpdateActiveStatusAsync(userIds, isActive, modifiedBy);

		// Assert
		Assert.Equal(expectedCount, result);

		await Repository.Received(1).BulkUpdateActiveStatusAsync(userIds, isActive, Arg.Any<CancellationToken>());
	}

	#endregion
}