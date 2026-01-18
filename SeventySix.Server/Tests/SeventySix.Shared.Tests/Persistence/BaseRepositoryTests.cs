// <copyright file="BaseRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Entities;
using SeventySix.Shared.Persistence;

namespace SeventySix.Shared.Tests.Persistence;

/// <summary>
/// Unit tests for BaseRepository template method pattern.
/// Verifies error handling and logging across all repository operations.
/// </summary>
public class BaseRepositoryTests
{
	private readonly ILogger<TestRepository> Logger;
	private readonly TestDbContext Context;
	private readonly TestRepository Repository;

	public BaseRepositoryTests()
	{
		DbContextOptions<TestDbContext> options =
			new DbContextOptionsBuilder<TestDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		Context =
			new TestDbContext(options);
		Logger =
			Substitute.For<ILogger<TestRepository>>();
		Repository =
			new TestRepository(Context, Logger);
	}

	/// <summary>
	/// Verifies ExecuteWithErrorHandlingAsync returns the operation result for a successful operation.
	/// </summary>
	[Fact]
	public async Task ExecuteWithErrorHandlingAsync_SuccessfulOperation_ReturnsResultAsync()
	{
		// Arrange
		int expectedResult = 42;

		// Act
		int result =
			await Repository.TestExecuteWithErrorHandlingAsync(
			async () => await Task.FromResult(expectedResult),
			"TestOperation",
			"TestEntity");

		// Assert
		Assert.Equal(expectedResult, result);
		Logger
			.DidNotReceive()
			.Log(
				LogLevel.Error,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				Arg.Any<Exception>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies DbUpdateException is logged and rethrown by ExecuteWithErrorHandlingAsync.
	/// </summary>
	[Fact]
	public async Task ExecuteWithErrorHandlingAsync_DbUpdateException_LogsAndRethrowsAsync()
	{
		// Arrange
		DbUpdateException exception =
			new DbUpdateException("Database error");

		// Act & Assert
		DbUpdateException thrown =
			await Assert.ThrowsAsync<DbUpdateException>(
			async () =>
				await Repository.TestExecuteWithErrorHandlingAsync<int>(
					() => throw exception,
					"TestOperation",
					"TestEntity"));

		Assert.Same(exception, thrown);
		Logger
			.Received()
			.Log(
				LogLevel.Error,
				Arg.Any<EventId>(),
				Arg.Is<object>(v => v.ToString()!.Contains("Database error")),
				Arg.Any<Exception>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies DbUpdateConcurrencyException is logged and rethrown by ExecuteWithErrorHandlingAsync.
	/// </summary>
	[Fact]
	public async Task ExecuteWithErrorHandlingAsync_DbUpdateConcurrencyException_LogsAndRethrowsAsync()
	{
		// Arrange
		DbUpdateConcurrencyException exception =
			new DbUpdateConcurrencyException("Concurrency conflict");

		// Act & Assert
		DbUpdateConcurrencyException thrown =
			await Assert.ThrowsAsync<DbUpdateConcurrencyException>(async () =>
				await Repository.TestExecuteWithErrorHandlingAsync<int>(
					() => throw exception,
					"TestOperation",
					"TestEntity"));

		Assert.Same(exception, thrown);
		Logger
			.Received()
			.Log(
				LogLevel.Error,
				Arg.Any<EventId>(),
				Arg.Is<object>(v =>
					v.ToString()!.Contains("Concurrency conflict")),
				Arg.Any<Exception>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies a generic exception is logged and rethrown by ExecuteWithErrorHandlingAsync.
	/// </summary>
	[Fact]
	public async Task ExecuteWithErrorHandlingAsync_GenericException_LogsAndRethrowsAsync()
	{
		// Arrange
		Exception exception =
			new Exception("Unexpected error");

		// Act & Assert
		Exception thrown =
			await Assert.ThrowsAsync<Exception>(async () =>
			await Repository.TestExecuteWithErrorHandlingAsync<int>(
				() => throw exception,
				"TestOperation",
				"TestEntity"));

		Assert.Same(exception, thrown);
		Logger
			.Received()
			.Log(
				LogLevel.Error,
				Arg.Any<EventId>(),
				Arg.Is<object>(v => v.ToString()!.Contains("Unexpected error")),
				Arg.Any<Exception>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies that creating a valid entity saves it to the context and returns the entity.
	/// </summary>
	[Fact]
	public async Task CreateAsync_ValidEntity_AddsToContextAndSavesAsync()
	{
		// Arrange
		TestEntity entity =
			new TestEntity { Id = 1, Name = "Test" };

		// Act
		TestEntity result =
			await Repository.TestCreateAsync(entity);

		// Assert
		Assert.Equal(entity, result);
		Assert.Single(Context.TestEntities);
		Assert.Equal(
			"Test",
			Context.TestEntities.First().Name);
	}

	/// <summary>
	/// Test repository implementation for testing BaseRepository.
	/// </summary>
	public class TestRepository(
		TestDbContext context,
		ILogger<TestRepository> logger) : BaseRepository<TestEntity, TestDbContext>(context, logger)
	{
		public Task<T> TestExecuteWithErrorHandlingAsync<T>(
			Func<Task<T>> operation,
			string operationName,
			string entityIdentifier)
		{
			return ExecuteWithErrorHandlingAsync(
				operation,
				operationName,
				entityIdentifier);
		}

		public Task<TestEntity> TestCreateAsync(TestEntity entity)
		{
			return CreateAsync(entity);
		}

		protected override string GetEntityIdentifier(TestEntity entity)
		{
			return $"{PropertyConstants.Id}={entity.Id}, Name={entity.Name}";
		}
	}

	/// <summary>
	/// Test entity for repository tests.
	/// </summary>
	public class TestEntity : IEntity
	{
		public long Id { get; set; }
		public string Name { get; set; } = string.Empty;
	}

	/// <summary>
	/// Test DbContext for repository tests.
	/// </summary>
	public class TestDbContext(DbContextOptions<TestDbContext> options)
		: DbContext(options)
	{
		public DbSet<TestEntity> TestEntities { get; set; } = null!;
	}
}