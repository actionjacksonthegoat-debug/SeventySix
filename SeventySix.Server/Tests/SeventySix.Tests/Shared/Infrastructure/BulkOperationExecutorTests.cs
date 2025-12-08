// <copyright file="BulkOperationExecutorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Tests.Shared.Infrastructure;

/// <summary>
/// Unit tests for BulkOperationExecutor.
/// </summary>
public class BulkOperationExecutorTests
{
	[Fact]
	public async Task ExecuteBulkUpdateAsync_ValidIds_UpdatesEntitiesAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options = new DbContextOptionsBuilder<TestDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;

		TestDbContext context = new TestDbContext(options);
		BulkOperationExecutor<TestEntity> executor = new BulkOperationExecutor<TestEntity>(context);

		context.TestEntities.AddRange(
			new TestEntity { Id = 1, Name = "First", IsActive = false },
			new TestEntity { Id = 2, Name = "Second", IsActive = false },
			new TestEntity { Id = 3, Name = "Third", IsActive = false }
		);
		await context.SaveChangesAsync();

		List<int> idsToUpdate = [1, 3];

		// Act
		int updatedCount = await executor.ExecuteBulkUpdateAsync(
			idsToUpdate,
			entity => entity.IsActive = true);

		// Assert
		Assert.Equal(2, updatedCount);

		List<TestEntity> allEntities = await context.TestEntities.ToListAsync();
		Assert.True(allEntities.First(e => e.Id == 1).IsActive);
		Assert.False(allEntities.First(e => e.Id == 2).IsActive);
		Assert.True(allEntities.First(e => e.Id == 3).IsActive);
	}

	[Fact]
	public async Task ExecuteBulkUpdateAsync_NoMatchingIds_ReturnsZeroAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options = new DbContextOptionsBuilder<TestDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;

		TestDbContext context = new TestDbContext(options);
		BulkOperationExecutor<TestEntity> executor = new BulkOperationExecutor<TestEntity>(context);

		context.TestEntities.Add(new TestEntity { Id = 1, Name = "First", IsActive = false });
		await context.SaveChangesAsync();

		List<int> idsToUpdate = [99, 100];

		// Act
		int updatedCount = await executor.ExecuteBulkUpdateAsync(
			idsToUpdate,
			entity => entity.IsActive = true);

		// Assert
		Assert.Equal(0, updatedCount);
	}

	[Fact]
	public async Task ExecuteBulkUpdateAsync_EmptyIds_ReturnsZeroAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options = new DbContextOptionsBuilder<TestDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;

		TestDbContext context = new TestDbContext(options);
		BulkOperationExecutor<TestEntity> executor = new BulkOperationExecutor<TestEntity>(context);

		List<int> idsToUpdate = [];

		// Act
		int updatedCount = await executor.ExecuteBulkUpdateAsync(
			idsToUpdate,
			entity => entity.IsActive = true);

		// Assert
		Assert.Equal(0, updatedCount);
	}

	[Fact]
	public async Task ExecuteBulkUpdateAsync_ComplexUpdate_AppliesAllChangesAsync()
	{
		// Arrange
		DbContextOptions<TestDbContext> options = new DbContextOptionsBuilder<TestDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;

		TestDbContext context = new TestDbContext(options);
		BulkOperationExecutor<TestEntity> executor = new BulkOperationExecutor<TestEntity>(context);

		context.TestEntities.AddRange(
			new TestEntity { Id = 1, Name = "First", IsActive = false },
			new TestEntity { Id = 2, Name = "Second", IsActive = false }
		);
		await context.SaveChangesAsync();

		List<int> idsToUpdate = [1, 2];

		// Act
		int updatedCount = await executor.ExecuteBulkUpdateAsync(
			idsToUpdate,
			entity =>
			{
				entity.IsActive = true;
				entity.Name = entity.Name.ToUpper();
			});

		// Assert
		Assert.Equal(2, updatedCount);

		List<TestEntity> allEntities = await context.TestEntities.ToListAsync();
		Assert.All(allEntities, e => Assert.True(e.IsActive));
		Assert.Equal("FIRST", allEntities.First(e => e.Id == 1).Name);
		Assert.Equal("SECOND", allEntities.First(e => e.Id == 2).Name);
	}

	public class TestEntity
	{
		public int Id
		{
			get; set;
		}
		public string Name { get; set; } = string.Empty;
		public bool IsActive
		{
			get; set;
		}
	}

	public class TestDbContext(DbContextOptions<TestDbContext> options) : DbContext(options)
	{
		public DbSet<TestEntity> TestEntities { get; set; } = null!;
	}
}