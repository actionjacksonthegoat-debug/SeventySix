// <copyright file="UserServiceTestFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.TestUtilities.Fixtures;

/// <summary>
/// Test fixture for <see cref="UserService"/> tests.
/// Provides pre-configured substitutes and service instance.
/// </summary>
public class UserServiceTestFixture
{
	public IUserRepository MockRepository
	{
		get;
	}
	public IPermissionRequestRepository MockPermissionRequestRepository
	{
		get;
	}
	public IValidator<CreateUserRequest> MockCreateValidator
	{
		get;
	}
	public IValidator<UpdateUserRequest> MockUpdateValidator
	{
		get;
	}
	public IValidator<UpdateProfileRequest> MockUpdateProfileValidator
	{
		get;
	}
	public IValidator<UserQueryRequest> MockQueryValidator
	{
		get;
	}
	public ITransactionManager MockTransactionManager
	{
		get;
	}
	public IPasswordService MockPasswordService
	{
		get;
	}
	public ILogger<UserService> MockLogger
	{
		get;
	}
	public UserService Service
	{
		get;
	}

	public UserServiceTestFixture()
	{
		MockRepository = Substitute.For<IUserRepository>();
		MockPermissionRequestRepository = Substitute.For<IPermissionRequestRepository>();
		MockCreateValidator = Substitute.For<IValidator<CreateUserRequest>>();
		MockUpdateValidator = Substitute.For<IValidator<UpdateUserRequest>>();
		MockUpdateProfileValidator = Substitute.For<IValidator<UpdateProfileRequest>>();
		MockQueryValidator = Substitute.For<IValidator<UserQueryRequest>>();
		MockTransactionManager = Substitute.For<ITransactionManager>();
		MockPasswordService = Substitute.For<IPasswordService>();
		MockLogger = Substitute.For<ILogger<UserService>>();

		SetupTransactionManagerDefaults();

		Service = new UserService(
			MockRepository,
			MockPermissionRequestRepository,
			MockCreateValidator,
			MockUpdateValidator,
			MockUpdateProfileValidator,
			MockQueryValidator,
			MockTransactionManager,
			MockPasswordService,
			MockLogger);
	}

	public UserServiceTestFixture WithSuccessfulCreateValidation()
	{
		MockCreateValidator.SetupSuccessfulValidation();
		return this;
	}

	public UserServiceTestFixture WithSuccessfulUpdateValidation()
	{
		MockUpdateValidator.SetupSuccessfulValidation();
		return this;
	}

	public UserServiceTestFixture WithSuccessfulUpdateProfileValidation()
	{
		MockUpdateProfileValidator.SetupSuccessfulValidation();
		return this;
	}

	public UserServiceTestFixture WithSuccessfulQueryValidation()
	{
		MockQueryValidator.SetupSuccessfulValidation();
		return this;
	}

	public UserServiceTestFixture WithAllValidatorsSuccessful()
	{
		MockCreateValidator.SetupSuccessfulValidation();
		MockUpdateValidator.SetupSuccessfulValidation();
		MockUpdateProfileValidator.SetupSuccessfulValidation();
		MockQueryValidator.SetupSuccessfulValidation();
		return this;
	}

	public UserServiceTestFixture WithNoDuplicateChecks()
	{
		MockRepository
			.UsernameExistsAsync(Arg.Any<string>(), Arg.Any<int?>(), Arg.Any<CancellationToken>())
			.Returns(false);

		MockRepository
			.EmailExistsAsync(Arg.Any<string>(), Arg.Any<int?>(), Arg.Any<CancellationToken>())
			.Returns(false);

		return this;
	}

	private void SetupTransactionManagerDefaults()
	{
		// Setup for operations returning UserDto
		MockTransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<UserDto>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				Func<CancellationToken, Task<UserDto>> operation = callInfo.Arg<Func<CancellationToken, Task<UserDto>>>();
				CancellationToken ct = callInfo.Arg<CancellationToken>();
				return operation(ct);
			});

		// Setup for operations returning int (bulk operations)
		MockTransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<int>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				Func<CancellationToken, Task<int>> operation = callInfo.Arg<Func<CancellationToken, Task<int>>>();
				CancellationToken ct = callInfo.Arg<CancellationToken>();
				return operation(ct);
			});

		// Setup for operations returning UserProfileDto? (profile updates)
		MockTransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<UserProfileDto?>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(callInfo =>
			{
				Func<CancellationToken, Task<UserProfileDto?>> operation =
					callInfo.Arg<Func<CancellationToken, Task<UserProfileDto?>>>();
				CancellationToken ct = callInfo.Arg<CancellationToken>();
				return operation(ct);
			});
	}
}