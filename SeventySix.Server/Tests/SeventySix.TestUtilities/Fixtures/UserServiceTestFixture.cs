// <copyright file="UserServiceTestFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.TestUtilities.Fixtures;

/// <summary>
/// Test fixture for <see cref="UserService"/> tests.
/// Provides pre-configured mocks and service instance to reduce test setup boilerplate.
/// </summary>
/// <remarks>
/// Reduces test constructor setup from ~30 lines to ~3 lines.
///
/// Usage:
/// <code>
/// private readonly UserServiceTestFixture _fixture = new();
///
/// [Fact]
/// public async Task MyTest()
/// {
///     _fixture.MockRepository.Setup(...);
///     var result = await _fixture.Service.GetAllUsersAsync();
/// }
/// </code>
///
/// Design Patterns:
/// - Test Fixture: Pre-configured test environment
/// - Builder: Fluent configuration for custom setups
/// </remarks>
public class UserServiceTestFixture
{
	/// <summary>
	/// Gets the mock repository.
	/// </summary>
	public Mock<IUserRepository> MockRepository
	{
		get;
	}

	/// <summary>
	/// Gets the mock create validator.
	/// </summary>
	public Mock<IValidator<CreateUserRequest>> MockCreateValidator
	{
		get;
	}

	/// <summary>
	/// Gets the mock update validator.
	/// </summary>
	public Mock<IValidator<UpdateUserRequest>> MockUpdateValidator
	{
		get;
	}

	/// <summary>
	/// Gets the mock query validator.
	/// </summary>
	public Mock<IValidator<UserQueryRequest>> MockQueryValidator
	{
		get;
	}

	/// <summary>
	/// Gets the mock transaction manager.
	/// </summary>
	public Mock<ITransactionManager> MockTransactionManager
	{
		get;
	}

	/// <summary>
	/// Gets the mock logger.
	/// </summary>
	public Mock<ILogger<UserService>> MockLogger
	{
		get;
	}

	/// <summary>
	/// Gets the service under test.
	/// </summary>
	public UserService Service
	{
		get;
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="UserServiceTestFixture"/> class.
	/// Creates all mocks with sensible defaults and instantiates the service.
	/// </summary>
	public UserServiceTestFixture()
	{
		MockRepository = new Mock<IUserRepository>();
		MockCreateValidator = new Mock<IValidator<CreateUserRequest>>();
		MockUpdateValidator = new Mock<IValidator<UpdateUserRequest>>();
		MockQueryValidator = new Mock<IValidator<UserQueryRequest>>();
		MockTransactionManager = new Mock<ITransactionManager>();
		MockLogger = new Mock<ILogger<UserService>>();

		SetupTransactionManagerDefaults();

		Service = new UserService(
			MockRepository.Object,
			MockCreateValidator.Object,
			MockUpdateValidator.Object,
			MockQueryValidator.Object,
			MockTransactionManager.Object,
			MockLogger.Object);
	}

	/// <summary>
	/// Sets up default successful validation for create requests.
	/// Call before tests that need validation to pass.
	/// </summary>
	/// <returns>This fixture for method chaining.</returns>
	public UserServiceTestFixture WithSuccessfulCreateValidation()
	{
		MockCreateValidator.SetupSuccessfulValidation();
		return this;
	}

	/// <summary>
	/// Sets up default successful validation for update requests.
	/// Call before tests that need validation to pass.
	/// </summary>
	/// <returns>This fixture for method chaining.</returns>
	public UserServiceTestFixture WithSuccessfulUpdateValidation()
	{
		MockUpdateValidator.SetupSuccessfulValidation();
		return this;
	}

	/// <summary>
	/// Sets up default successful validation for query requests.
	/// Call before tests that need validation to pass.
	/// </summary>
	/// <returns>This fixture for method chaining.</returns>
	public UserServiceTestFixture WithSuccessfulQueryValidation()
	{
		MockQueryValidator.SetupSuccessfulValidation();
		return this;
	}

	/// <summary>
	/// Sets up all validators to return successful validation.
	/// Convenience method for tests that don't focus on validation.
	/// </summary>
	/// <returns>This fixture for method chaining.</returns>
	public UserServiceTestFixture WithAllValidatorsSuccessful()
	{
		MockCreateValidator.SetupSuccessfulValidation();
		MockUpdateValidator.SetupSuccessfulValidation();
		MockQueryValidator.SetupSuccessfulValidation();
		return this;
	}

	/// <summary>
	/// Sets up repository to indicate username/email do not exist (no duplicates).
	/// Call before create/update tests that should succeed.
	/// </summary>
	/// <returns>This fixture for method chaining.</returns>
	public UserServiceTestFixture WithNoDuplicateChecks()
	{
		MockRepository
			.Setup(r => r.UsernameExistsAsync(
				It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		MockRepository
			.Setup(r => r.EmailExistsAsync(
				It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		return this;
	}

	/// <summary>
	/// Configures the transaction manager to immediately execute delegates.
	/// This is the default behavior - transactions pass through without retry logic.
	/// </summary>
	private void SetupTransactionManagerDefaults()
	{
		// Setup for operations returning UserDto
		MockTransactionManager
			.Setup(tm => tm.ExecuteInTransactionAsync(
				It.IsAny<Func<CancellationToken, Task<UserDto>>>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()))
			.Returns<Func<CancellationToken, Task<UserDto>>, int, CancellationToken>(
				async (operation, retries, ct) => await operation(ct));

		// Setup for operations returning int (bulk operations)
		MockTransactionManager
			.Setup(tm => tm.ExecuteInTransactionAsync(
				It.IsAny<Func<CancellationToken, Task<int>>>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()))
			.Returns<Func<CancellationToken, Task<int>>, int, CancellationToken>(
				async (operation, retries, ct) => await operation(ct));
	}
}
