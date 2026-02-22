// <copyright file="BulkOperationExecutorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Persistence;
using Shouldly;

namespace SeventySix.Shared.Tests.Persistence;

/// <summary>
/// Unit tests for BulkOperationExecutor.
/// </summary>
public sealed class BulkOperationExecutorTests
{
	[Fact]
	public async Task ExecuteBulkUpdateAsync_ValidIds_UpdatesEntitiesAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options =
			new DbContextOptionsBuilder<TestDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		TestDbContext context =
			new(options);
		BulkOperationExecutor<TestEntity> executor =
			new(context);

		context.TestEntities.AddRange(
			new TestEntity
			{
				Id = 1,
				Name = "First",
				IsActive = false,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Second",
				IsActive = false,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Third",
				IsActive = false,
			});
		await context.SaveChangesAsync();

		List<long> idsToUpdate =
			[1L, 3L];

		// Act
		long updatedCount =
			await executor.ExecuteBulkUpdateAsync(
			idsToUpdate,
			entity => entity.IsActive = true);

		// Assert
		updatedCount.ShouldBe(2);

		List<TestEntity> allEntities =
			await context.TestEntities.ToListAsync();
		allEntities.First(entity => entity.Id == 1).IsActive.ShouldBeTrue();
		allEntities.First(entity => entity.Id == 2).IsActive.ShouldBeFalse();
		allEntities.First(entity => entity.Id == 3).IsActive.ShouldBeTrue();
	}

	[Fact]
	public async Task ExecuteBulkUpdateAsync_NoMatchingIds_ReturnsZeroAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options =
			new DbContextOptionsBuilder<TestDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		TestDbContext context =
			new(options);
		BulkOperationExecutor<TestEntity> executor =
			new(context);

		context.TestEntities.Add(
			new TestEntity
			{
				Id = 1,
				Name = "First",
				IsActive = false,
			});
		await context.SaveChangesAsync();

		List<long> idsToUpdate =
			[99L, 100L];

		// Act
		long updatedCount =
			await executor.ExecuteBulkUpdateAsync(
			idsToUpdate,
			entity => entity.IsActive = true);

		// Assert
		updatedCount.ShouldBe(0);
	}

	[Fact]
	public async Task ExecuteBulkUpdateAsync_EmptyIds_ReturnsZeroAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options =
			new DbContextOptionsBuilder<TestDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		TestDbContext context =
			new(options);
		BulkOperationExecutor<TestEntity> executor =
			new(context);

		List<long> idsToUpdate = [];

		// Act
		long updatedCount =
			await executor.ExecuteBulkUpdateAsync(
			idsToUpdate,
			entity => entity.IsActive = true);

		// Assert
		updatedCount.ShouldBe(0);
	}

	[Fact]
	public async Task ExecuteBulkUpdateAsync_ComplexUpdate_AppliesAllChangesAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options =
			new DbContextOptionsBuilder<TestDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		TestDbContext context =
			new(options);
		BulkOperationExecutor<TestEntity> executor =
			new(context);

		context.TestEntities.AddRange(
			new TestEntity
			{
				Id = 1,
				Name = "First",
				IsActive = false,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Second",
				IsActive = false,
			});
		await context.SaveChangesAsync();

		List<long> idsToUpdate =
			[1L, 2L];

		// Act
		long updatedCount =
			await executor.ExecuteBulkUpdateAsync(
				idsToUpdate,
				entity =>
				{
					entity.IsActive = true;
					entity.Name = entity.Name.ToUpper();
				});

		// Assert
		updatedCount.ShouldBe(2);

		List<TestEntity> allEntities =
			await context.TestEntities.ToListAsync();
		allEntities.ShouldAllBe(entity => entity.IsActive);
		allEntities.First(entity => entity.Id == 1L).Name.ShouldBe("FIRST");
		allEntities.First(entity => entity.Id == 2L).Name.ShouldBe("SECOND");
	}

	public sealed class TestEntity
	{
		public long Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public bool IsActive { get; set; }
	}

	public sealed class TestDbContext(DbContextOptions<TestDbContext> options)
		: DbContext(options)
	{
		public DbSet<TestEntity> TestEntities { get; set; } = null!;
	}
}