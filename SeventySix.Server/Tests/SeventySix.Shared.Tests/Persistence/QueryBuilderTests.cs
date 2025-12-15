using SeventySix.Shared.Persistence;

namespace SeventySix.Shared.Tests.Persistence;

public sealed class QueryBuilderTests
{
	[Fact]
	public void Where_SingleCondition_AppliesFilter()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30 },
			new TestEntity { Id = 2, Name = "Bob", Age = 25 },
			new TestEntity { Id = 3, Name = "Charlie", Age = 35 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder.Where(entity => entity.Age > 28))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Alice");
		Assert.Contains(result, entity => entity.Name == "Charlie");
	}

	[Fact]
	public void Where_MultipleConditions_AppliesAllFilters()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30, IsActive = true },
			new TestEntity { Id = 2, Name = "Bob", Age = 25, IsActive = false },
			new TestEntity { Id = 3, Name = "Charlie", Age = 35, IsActive = true },
			new TestEntity { Id = 4, Name = "Diana", Age = 32, IsActive = false }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder
				.Where(entity => entity.Age > 28)
				.Where(entity => entity.IsActive))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Alice");
		Assert.Contains(result, entity => entity.Name == "Charlie");
	}

	[Fact]
	public void OrderBy_AscendingOrder_SortsCorrectly()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Charlie", Age = 35 },
			new TestEntity { Id = 2, Name = "Alice", Age = 30 },
			new TestEntity { Id = 3, Name = "Bob", Age = 25 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder.OrderBy(entity => entity.Name))
			.ToList();

		// Assert
		Assert.Equal(3, result.Count);
		Assert.Equal("Alice", result[0].Name);
		Assert.Equal("Bob", result[1].Name);
		Assert.Equal("Charlie", result[2].Name);
	}

	[Fact]
	public void OrderByDescending_DescendingOrder_SortsCorrectly()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30 },
			new TestEntity { Id = 2, Name = "Bob", Age = 25 },
			new TestEntity { Id = 3, Name = "Charlie", Age = 35 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder.OrderByDescending(entity => entity.Age))
			.ToList();

		// Assert
		Assert.Equal(3, result.Count);
		Assert.Equal(35, result[0].Age);
		Assert.Equal(30, result[1].Age);
		Assert.Equal(25, result[2].Age);
	}

	[Fact]
	public void ThenBy_SecondarySort_AppliesTieBreaker()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30 },
			new TestEntity { Id = 2, Name = "Charlie", Age = 30 },
			new TestEntity { Id = 3, Name = "Bob", Age = 30 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder
				.OrderBy(entity => entity.Age)
				.ThenBy(entity => entity.Name))
			.ToList();

		// Assert
		Assert.Equal(3, result.Count);
		Assert.Equal("Alice", result[0].Name);
		Assert.Equal("Bob", result[1].Name);
		Assert.Equal("Charlie", result[2].Name);
	}

	[Fact]
	public void Skip_ValidCount_SkipsItems()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30 },
			new TestEntity { Id = 2, Name = "Bob", Age = 25 },
			new TestEntity { Id = 3, Name = "Charlie", Age = 35 },
			new TestEntity { Id = 4, Name = "Diana", Age = 28 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder.Skip(2))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Charlie");
		Assert.Contains(result, entity => entity.Name == "Diana");
	}

	[Fact]
	public void Take_ValidCount_LimitsResults()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30 },
			new TestEntity { Id = 2, Name = "Bob", Age = 25 },
			new TestEntity { Id = 3, Name = "Charlie", Age = 35 },
			new TestEntity { Id = 4, Name = "Diana", Age = 28 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder.Take(2))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
	}

	[Fact]
	public void Paginate_ValidPageAndSize_ReturnsPaginatedResults()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30 },
			new TestEntity { Id = 2, Name = "Bob", Age = 25 },
			new TestEntity { Id = 3, Name = "Charlie", Age = 35 },
			new TestEntity { Id = 4, Name = "Diana", Age = 28 },
			new TestEntity { Id = 5, Name = "Eve", Age = 32 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder.Paginate(2, 2))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Charlie");
		Assert.Contains(result, entity => entity.Name == "Diana");
	}

	[Fact]
	public void FluentChaining_ComplexQuery_AppliesAllOperations()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30, IsActive = true },
			new TestEntity { Id = 2, Name = "Bob", Age = 25, IsActive = false },
			new TestEntity { Id = 3, Name = "Charlie", Age = 35, IsActive = true },
			new TestEntity { Id = 4, Name = "Diana", Age = 28, IsActive = true },
			new TestEntity { Id = 5, Name = "Eve", Age = 32, IsActive = true },
			new TestEntity { Id = 6, Name = "Frank", Age = 27, IsActive = false }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder
				.Where(entity => entity.IsActive)
				.Where(entity => entity.Age >= 28)
				.OrderByDescending(entity => entity.Age)
				.ThenBy(entity => entity.Name)
				.Skip(1)
				.Take(2))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Equal("Eve", result[0].Name);
		Assert.Equal("Alice", result[1].Name);
	}

	[Fact]
	public void EmptyBuilder_NoOperations_ReturnsAllItems()
	{
		// Arrange
		List<TestEntity> entities = [
			new TestEntity { Id = 1, Name = "Alice", Age = 30 },
			new TestEntity { Id = 2, Name = "Bob", Age = 25 }
		];

		// Act
		List<TestEntity> result = entities.AsQueryable()
			.ApplyQueryBuilder(builder => builder)
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
	}
}

public sealed class TestEntity
{
	public int Id
	{
		get; set;
	}
	public string Name { get; set; } = string.Empty;
	public int Age
	{
		get; set;
	}
	public bool IsActive
	{
		get; set;
	}
}