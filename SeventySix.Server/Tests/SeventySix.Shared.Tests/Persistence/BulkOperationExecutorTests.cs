// <copyright file="BulkOperationExecutorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Persistence;

namespace SeventySix.Shared.Tests.Persistence;

/// <summary>
/// Unit tests for BulkOperationExecutor.
/// </summary>
public class BulkOperationExecutorTests
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
		Assert.Equal(2, updatedCount);

		List<TestEntity> allEntities =
			await context.TestEntities.ToListAsync();
		Assert.True(allEntities.First(e => e.Id == 1).IsActive);
		Assert.False(allEntities.First(e => e.Id == 2).IsActive);
		Assert.True(allEntities.First(e => e.Id == 3).IsActive);
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
		Assert.Equal(0, updatedCount);
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
		Assert.Equal(0, updatedCount);
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
		Assert.Equal(2, updatedCount);

		List<TestEntity> allEntities =
			await context.TestEntities.ToListAsync();
		Assert.All(
			allEntities,
			entity => Assert.True(entity.IsActive));
		Assert.Equal(
			"FIRST",
			allEntities.First(entity => entity.Id == 1L).Name);
		Assert.Equal(
			"SECOND",
			allEntities.First(entity => entity.Id == 2L).Name);
	}

	public class TestEntity
	{
		public long Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public bool IsActive { get; set; }
	}

	public class TestDbContext(DbContextOptions<TestDbContext> options)
		: DbContext(options)
	{
		public DbSet<TestEntity> TestEntities { get; set; } = null!;
	}
}