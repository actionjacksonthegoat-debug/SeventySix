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

public class UserServiceTests
{
	private readonly IUserRepository Repository;
	private readonly IPermissionRequestRepository PermissionRequestRepository;
	private readonly IValidator<CreateUserRequest> CreateValidator;
	private readonly IValidator<UpdateUserRequest> UpdateValidator;
	private readonly IValidator<UpdateProfileRequest> UpdateProfileValidator;
	private readonly IValidator<UserQueryRequest> QueryValidator;
	private readonly ITransactionManager TransactionManager;
	private readonly IPasswordService PasswordService;
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
		PasswordService = Substitute.For<IPasswordService>();
		Logger = Substitute.For<ILogger<UserService>>();

		SetupTransactionManager();

		Service = new UserService(
			Repository,
			PermissionRequestRepository,
			CreateValidator,
			UpdateValidator,
			UpdateProfileValidator,
			QueryValidator,
			TransactionManager,
			PasswordService,
			Logger);
	}

	#region Helper Methods

	private static User CreateTestUser(
		int id = 1,
		string username = "testuser",
		string email = "test@example.com",
		string fullName = "Test User",
		bool isActive = true) =>
		new()
		{
			Id = id,
			Username = username,
			Email = email,
			FullName = fullName,
			IsActive = isActive,
			CreateDate = DateTime.UtcNow,
			CreatedBy = TestAuditConstants.SystemUser,
			ModifiedBy = TestAuditConstants.SystemUser,
			IsDeleted = false,
			RowVersion = 1,
		};

	private static CreateUserRequest CreateValidRequest(
		string username = "new_user",
		string email = "new@example.com",
		string fullName = "New User",
		bool isActive = true) =>
		new()
		{
			Username = username,
			Email = email,
			FullName = fullName,
			IsActive = isActive,
		};

	private static UpdateUserRequest CreateValidUpdateRequest(
		int id = 1,
		string username = "testuser",
		string email = "test@example.com",
		string fullName = "Test User",
		bool isActive = true) =>
		new()
		{
			Id = id,
			Username = username,
			Email = email,
			FullName = fullName,
			IsActive = isActive,
		};

	private void SetupSuccessfulCreateFlow(
		CreateUserRequest request,
		int assignedId = 1)
	{
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
					User user = callInfo.ArgAt<User>(0);
					user.Id = assignedId;
					return user;
				});
	}

	private void SetupSuccessfulUpdateFlow(
		UpdateUserRequest request,
		User existingUser)
	{
		UpdateValidator.SetupSuccessfulValidation();

		Repository
			.GetByIdAsync(request.Id, Arg.Any<CancellationToken>())
			.Returns(existingUser);

		Repository
			.UsernameExistsAsync(request.Username, request.Id, Arg.Any<CancellationToken>())
			.Returns(false);

		Repository
			.EmailExistsAsync(request.Email, request.Id, Arg.Any<CancellationToken>())
			.Returns(false);
	}

	private void SetupTransactionManager()
	{
		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<UserDto>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(
				async callInfo =>
				{
					Func<CancellationToken, Task<UserDto>> operation =
						callInfo.ArgAt<Func<CancellationToken, Task<UserDto>>>(0);
					CancellationToken cancellationToken =
						callInfo.ArgAt<CancellationToken>(2);
					return await operation(cancellationToken);
				});

		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<int>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(
				async callInfo =>
				{
					Func<CancellationToken, Task<int>> operation =
						callInfo.ArgAt<Func<CancellationToken, Task<int>>>(0);
					CancellationToken cancellationToken =
						callInfo.ArgAt<CancellationToken>(2);
					return await operation(cancellationToken);
				});
	}

	private UserService CreateServiceWithMockPasswordService(
		IPasswordService mockPasswordService) =>
		new(
			Repository,
			PermissionRequestRepository,
			CreateValidator,
			UpdateValidator,
			UpdateProfileValidator,
			QueryValidator,
			TransactionManager,
			mockPasswordService,
			Logger);

	#endregion

	#region GetAllUsersAsync Tests

	[Theory]
	[InlineData(2, "user1")]
	[InlineData(0, null)]
	public async Task GetAllUsersAsync_ReturnsExpectedResultAsync(
		int userCount,
		string? firstUsername)
	{
		// Arrange
		List<UserDto> userDtos = userCount > 0
			? [
				new UserDtoBuilder().WithId(1).WithUsername(firstUsername!).Build(),
				new UserDtoBuilder().WithId(2).WithUsername("user2").Build(),
			]
			: [];

		Repository
			.GetAllProjectedAsync(Arg.Any<CancellationToken>())
			.Returns(userDtos);

		// Act
		IEnumerable<UserDto> result = await Service.GetAllUsersAsync();

		// Assert
		result.Count().ShouldBe(userCount);
		if (userCount > 0)
		{
			result.First().Username.ShouldBe(firstUsername);
		}
	}
	#endregion
	#region GetUserByIdAsync Tests

	[Fact]
	public async Task GetUserByIdAsync_ShouldReturnUser_WhenUserExistsAsync()
	{
		// Arrange
		User user = CreateTestUser(
			id: 123,
			username: "john_doe");

		Repository
			.GetByIdAsync(123, Arg.Any<CancellationToken>())
			.Returns(user);

		// Act
		UserDto? result = await Service.GetUserByIdAsync(123);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBe(123);
		result.Username.ShouldBe("john_doe");
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
		result.ShouldBeNull();
	}
	#endregion
	#region CreateUserAsync Tests

	[Fact]
	public async Task CreateUserAsync_ShouldCreateUser_WhenRequestIsValidAsync()
	{
		// Arrange
		CreateUserRequest request = CreateValidRequest();
		SetupSuccessfulCreateFlow(request, 456);

		// Act
		UserDto result = await Service.CreateUserAsync(request);

		// Assert
		result.Id.ShouldBe(456);
		result.Username.ShouldBe("new_user");
		result.Email.ShouldBe("new@example.com");
		result.FullName.ShouldBe("New User");
		result.IsActive.ShouldBeTrue();
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
	}

	[Theory]
	[InlineData("", true)]
	[InlineData("User Name", false)]
	public async Task CreateUserAsync_HandlesEdgeCasesAsync(
		string fullName,
		bool isActive)
	{
		// Arrange
		CreateUserRequest request =
			CreateValidRequest(
				fullName: fullName,
				isActive: isActive);
		SetupSuccessfulCreateFlow(request);

		// Act
		UserDto result = await Service.CreateUserAsync(request);

		// Assert
		result.FullName.ShouldBe(fullName);
		result.IsActive.ShouldBe(isActive);
	}

	[Fact]
	public async Task CreateUserAsync_CallsInitiatePasswordReset_WithIsNewUserTrueAsync()
	{
		// Arrange
		IPasswordService mockPasswordService = Substitute.For<IPasswordService>();
		UserService service = CreateServiceWithMockPasswordService(mockPasswordService);
		CreateUserRequest request = CreateValidRequest();
		SetupSuccessfulCreateFlow(
			request,
			123);

		// Act
		await service.CreateUserAsync(request);

		// Assert
		await mockPasswordService.Received(1)
			.InitiatePasswordResetAsync(
				Arg.Is<int>(userId => userId == 123),
				isNewUser: true,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateUserAsync_WhenEmailRateLimited_MarksUserAndRethrowsAsync()
	{
		// Arrange
		IPasswordService mockPasswordService = Substitute.For<IPasswordService>();
		mockPasswordService
			.InitiatePasswordResetAsync(
				Arg.Any<int>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(
				new EmailRateLimitException(
					TimeSpan.FromHours(12),
					0));

		UserService service = CreateServiceWithMockPasswordService(mockPasswordService);
		CreateUserRequest request = CreateValidRequest();
		SetupSuccessfulCreateFlow(
			request,
			123);

		User createdUser =
			new()
			{
				Id = 123,
				Username = "new_user",
				Email = "new@example.com",
				FullName = "New User",
				IsActive = true,
				NeedsPendingEmail = false
			};

		Repository
			.GetByIdAsync(
				123,
				Arg.Any<CancellationToken>())
			.Returns(createdUser);

		// Act & Assert
		await Should.ThrowAsync<EmailRateLimitException>(
			() => service.CreateUserAsync(request));

		await Repository.Received(1)
			.UpdateAsync(
				Arg.Any<User>(),
				Arg.Any<CancellationToken>());

		createdUser.NeedsPendingEmail.ShouldBeTrue();
	}
	#endregion
	#region UpdateUserAsync Tests

	[Fact]
	public async Task UpdateUserAsync_ValidRequest_ReturnsUpdatedUserDtoAsync()
	{
		// Arrange
		UpdateUserRequest request =
			CreateValidUpdateRequest(
				username: "updateduser",
				email: "updated@example.com",
				fullName: "Updated User");

		User existingUser = CreateTestUser();

		User updatedUser =
			CreateTestUser(
				id: 1,
				username: request.Username,
				email: request.Email,
				fullName: request.FullName);

		SetupSuccessfulUpdateFlow(request, existingUser);

		Repository
			.UpdateAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
			.Returns(updatedUser);

		// Act
		UserDto result = await Service.UpdateUserAsync(request);

		// Assert
		result.Id.ShouldBe(updatedUser.Id);
		result.Username.ShouldBe(updatedUser.Username);
		result.Email.ShouldBe(updatedUser.Email);
		result.FullName.ShouldBe(updatedUser.FullName);
	}

	[Fact]
	public async Task UpdateUserAsync_UserNotFound_ThrowsUserNotFoundExceptionAsync()
	{
		// Arrange
		UpdateUserRequest request =
			CreateValidUpdateRequest(id: 999);

		ValidationResult validationResult = new();
		UpdateValidator
			.ValidateAsync(
				Arg.Any<ValidationContext<UpdateUserRequest>>(),
				Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.GetByIdAsync(
				request.Id,
				Arg.Any<CancellationToken>())
			.Returns((User?)null);

		// Act & Assert
		UserNotFoundException exception =
			await Assert.ThrowsAsync<UserNotFoundException>(
				() => Service.UpdateUserAsync(request));

		exception.Message.ShouldContain(request.Id.ToString());
	}

	[Fact]
	public async Task UpdateUserAsync_DuplicateUsername_ThrowsDuplicateUserExceptionAsync()
	{
		// Arrange
		UpdateUserRequest request =
			CreateValidUpdateRequest(username: "duplicate");

		User existingUser = CreateTestUser();

		UpdateValidator.SetupSuccessfulValidation();

		Repository
			.GetByIdAsync(request.Id, Arg.Any<CancellationToken>())
			.Returns(existingUser);

		Repository
			.UsernameExistsAsync(request.Username, request.Id, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act & Assert
		DuplicateUserException exception =
			await Assert.ThrowsAsync<DuplicateUserException>(
				() => Service.UpdateUserAsync(request));

		exception.Message.ShouldContain(request.Username);
	}

	[Fact]
	public async Task UpdateUserAsync_ConcurrencyConflict_ThrowsConcurrencyExceptionAsync()
	{
		// Arrange
		UpdateUserRequest request =
			CreateValidUpdateRequest();

		User existingUser = CreateTestUser();

		ValidationResult validationResult = new();
		UpdateValidator
			.ValidateAsync(
				Arg.Any<ValidationContext<UpdateUserRequest>>(),
				Arg.Any<CancellationToken>())
			.Returns(validationResult);

		Repository
			.GetByIdAsync(
				request.Id,
				Arg.Any<CancellationToken>())
			.Returns(existingUser);

		Repository
			.UpdateAsync(
				Arg.Any<User>(),
				Arg.Any<CancellationToken>())
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
		// Arrange & Act
		await Service.DeleteUserAsync(
			1,
			"Admin");

		// Assert
		await Repository.Received(1)
			.SoftDeleteAsync(
				1,
				"Admin",
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task RestoreUserAsync_ValidId_RestoresUserAsync()
	{
		// Arrange & Act
		await Service.RestoreUserAsync(1);

		// Assert
		await Repository.Received(1)
			.RestoreAsync(
				1,
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region GetPagedUsersAsync Tests

	[Fact]
	public async Task GetPagedUsersAsync_ValidRequest_ReturnsPagedResultAsync()
	{
		// Arrange
		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = "test",
			};

		List<UserDto> userDtos =
		[
			new UserDtoBuilder().WithId(1).Build(),
			new UserDtoBuilder().WithId(2).Build(),
		];

		QueryValidator.SetupSuccessfulValidation();

		Repository
			.GetPagedProjectedAsync(
				request,
				Arg.Any<CancellationToken>())
			.Returns((userDtos.AsEnumerable(), 15));

		// Act
		PagedResult<UserDto> result = await Service.GetPagedUsersAsync(request);

		// Assert
		result.Items.Count().ShouldBe(2);
		result.TotalCount.ShouldBe(15);
		result.TotalPages.ShouldBe(2);
	}

	#endregion

	#region GetByUsername and GetByEmail Tests

	public static TheoryData<string, User?> UsernameTestData =>
	new()
	{
{
"testuser",
new User
{
Id = 1,
Username = "testuser",
Email = TestUserConstants.DefaultEmail,
FullName = "Test User",
IsActive = true,
CreateDate = DateTime.UtcNow,
CreatedBy = TestAuditConstants.SystemUser,
IsDeleted = false,
RowVersion = 1,
}
},
{ "nonexistent", null },
	};

	public static TheoryData<string, User?> EmailTestData =>
	new()
	{
{
"test@example.com",
new User
{
Id = 1,
Username = TestUserConstants.DefaultUsername,
Email = "test@example.com",
FullName = "Test User",
IsActive = true,
CreateDate = DateTime.UtcNow,
CreatedBy = TestAuditConstants.SystemUser,
IsDeleted = false,
RowVersion = 1,
}
},
{ "nonexistent@example.com", null },
	};

	[Theory]
	[MemberData(nameof(UsernameTestData))]
	public async Task GetByUsernameAsync_ReturnsExpectedResultAsync(
	string username,
	User? user)
	{
		// Arrange
		Repository
		.GetByUsernameAsync(
		username,
		Arg.Any<CancellationToken>())
		.Returns(user);

		// Act
		UserDto? result = await Service.GetByUsernameAsync(username);

		// Assert
		if (user is null)
		{
			result.ShouldBeNull();
		}
		else
		{
			result.ShouldNotBeNull();
			result.Id.ShouldBe(user.Id);
			result.Username.ShouldBe(user.Username);
			result.Email.ShouldBe(user.Email);
		}
	}

	[Theory]
	[MemberData(nameof(EmailTestData))]
	public async Task GetByEmailAsync_ReturnsExpectedResultAsync(
	string email,
	User? user)
	{
		// Arrange
		Repository
		.GetByEmailAsync(
		email,
		Arg.Any<CancellationToken>())
		.Returns(user);

		// Act
		UserDto? result = await Service.GetByEmailAsync(email);

		// Assert
		if (user is null)
		{
			result.ShouldBeNull();
		}
		else
		{
			result.ShouldNotBeNull();
			result.Id.ShouldBe(user.Id);
			result.Email.ShouldBe(user.Email);
		}
	}

	#endregion

	#region ExistsAsync Tests

	[Theory]
	[InlineData("testuser", true)]
	[InlineData("newuser", false)]
	public async Task UsernameExistsAsync_ReturnsExpectedResultAsync(
		string username,
		bool expectedExists)
	{
		// Arrange
		Repository
			.UsernameExistsAsync(
				username,
				null,
				Arg.Any<CancellationToken>())
			.Returns(expectedExists);

		// Act
		bool actualExists = await Service.UsernameExistsAsync(username);

		// Assert
		actualExists.ShouldBe(expectedExists);
	}

	[Theory]
	[InlineData("test@example.com", true)]
	[InlineData("new@example.com", false)]
	public async Task EmailExistsAsync_ReturnsExpectedResultAsync(
		string email,
		bool expectedExists)
	{
		// Arrange
		Repository
			.EmailExistsAsync(
				email,
				null,
				Arg.Any<CancellationToken>())
			.Returns(expectedExists);

		// Act
		bool actualExists = await Service.EmailExistsAsync(email);

		// Assert
		actualExists.ShouldBe(expectedExists);
	}

	#endregion

	#region BulkUpdateActiveStatusAsync Tests

	[Fact]
	public async Task BulkUpdateActiveStatusAsync_ValidRequest_UpdatesUsersAsync()
	{
		// Arrange
		List<int> userIds = [1, 2, 3];
		Repository
			.BulkUpdateActiveStatusAsync(
				userIds,
				false,
				Arg.Any<CancellationToken>())
			.Returns(3);

		// Act
		int result =
			await Service.BulkUpdateActiveStatusAsync(
				userIds,
				false,
				"Admin");

		// Assert
		result.ShouldBe(3);
	}

	#endregion
}
