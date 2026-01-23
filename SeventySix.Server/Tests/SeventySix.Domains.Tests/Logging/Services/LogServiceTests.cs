// <copyright file="LogServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.Logging;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Services;

/// <summary>
/// Unit tests for <see cref="LogService"/>.
/// </summary>
/// <remarks>
/// Tests focus on service-level concerns:
/// - Validation integration
/// - Argument validation
/// - ContextName property
/// Low-level mapping logic is tested in command handler tests.
/// </remarks>
public class LogServiceTests
{
	private readonly ILogRepository Repository;
	private readonly IValidator<LogQueryRequest> QueryValidator;
	private readonly LogService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="LogServiceTests"/> class.
	/// </summary>
	public LogServiceTests()
	{
		Repository =
			Substitute.For<ILogRepository>();
		QueryValidator =
			Substitute.For<IValidator<LogQueryRequest>>();

		Service =
			new LogService(Repository, QueryValidator);
	}

	#region ContextName Tests

	/// <summary>
	/// Tests that ContextName returns the correct value.
	/// </summary>
	[Fact]
	public void ContextName_ReturnsLogging()
	{
		// Assert
		Service.ContextName.ShouldBe("Logging");
	}

	#endregion

	#region GetPagedLogsAsync Tests

	/// <summary>
	/// Tests that validation is invoked for query requests.
	/// </summary>
	/// <remarks>
	/// Testing that ValidateAndThrowAsync throws ValidationException is unreliable
	/// with mocks because it's an extension method. The actual validation logic is tested
	/// in LogQueryRequestValidatorTests. This test verifies the validator is invoked.
	/// </remarks>
	[Fact]
	public async Task GetPagedLogsAsync_InvokesValidatorAsync()
	{
		// Arrange
		LogQueryRequest request =
			new() { Page = 1, PageSize = 10 };

		QueryValidator.SetupSuccessfulValidation();

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(([], 0));

		// Act
		await Service.GetPagedLogsAsync(
			request,
			CancellationToken.None);

		// Assert - Validator was called
		await QueryValidator
			.Received(1)
			.ValidateAsync(
				Arg.Any<ValidationContext<LogQueryRequest>>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that valid request returns paged result.
	/// </summary>
	[Fact]
	public async Task GetPagedLogsAsync_ValidRequest_ReturnsPagedResultAsync()
	{
		// Arrange
		LogQueryRequest request =
			new() { Page = 1, PageSize = 10 };

		List<Log> logs =
			[
				new()
				{
					Id = 1,
					LogLevel = "Error",
					Message = "Test",
				},
			];

		QueryValidator.SetupSuccessfulValidation();

		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns((logs, 1));

		// Act
		PagedResult<LogDto> result =
			await Service.GetPagedLogsAsync(
				request,
				CancellationToken.None);

		// Assert
		result.Items.Count.ShouldBe(1);
		result.TotalCount.ShouldBe(1);
		result.Page.ShouldBe(1);
		result.PageSize.ShouldBe(10);
	}

	#endregion

	#region CreateClientLogAsync Tests

	/// <summary>
	/// Tests that null request throws ArgumentNullException.
	/// </summary>
	[Fact]
	public async Task CreateClientLogAsync_NullRequest_ThrowsArgumentNullExceptionAsync()
	{
		// Act & Assert
		await Should.ThrowAsync<ArgumentNullException>(
			async () => await Service.CreateClientLogAsync(
				null!,
				CancellationToken.None));
	}

	#endregion

	#region CreateClientLogBatchAsync Tests

	/// <summary>
	/// Tests that null requests array throws ArgumentNullException.
	/// </summary>
	[Fact]
	public async Task CreateClientLogBatchAsync_NullRequests_ThrowsArgumentNullExceptionAsync()
	{
		// Act & Assert
		await Should.ThrowAsync<ArgumentNullException>(
			async () => await Service.CreateClientLogBatchAsync(
				null!,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that empty array returns early without calling repository.
	/// </summary>
	[Fact]
	public async Task CreateClientLogBatchAsync_EmptyArray_DoesNotCallRepositoryAsync()
	{
		// Arrange
		CreateLogRequest[] requests =
			[];

		// Act
		await Service.CreateClientLogBatchAsync(
			requests,
			CancellationToken.None);

		// Assert
		await Repository
			.DidNotReceive()
			.CreateAsync(
				Arg.Any<Log>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region CheckHealthAsync Tests

	/// <summary>
	/// Tests that successful repository call returns true.
	/// </summary>
	[Fact]
	public async Task CheckHealthAsync_HealthyDatabase_ReturnsTrueAsync()
	{
		// Arrange
		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns(([], 0));

		// Act
		bool result =
			await Service.CheckHealthAsync(
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that repository exception returns false.
	/// </summary>
	[Fact]
	public async Task CheckHealthAsync_DatabaseException_ReturnsFalseAsync()
	{
		// Arrange
		Repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(
				new InvalidOperationException("Database unavailable"));

		// Act
		bool result =
			await Service.CheckHealthAsync(
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	#endregion
}
