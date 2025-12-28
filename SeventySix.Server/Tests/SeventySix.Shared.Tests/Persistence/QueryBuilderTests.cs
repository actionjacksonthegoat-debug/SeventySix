using SeventySix.Shared.Persistence;

namespace SeventySix.Shared.Tests.Persistence;

/// <summary>
/// Unit tests for <see cref="SeventySix.Shared.Persistence.QueryBuilder"/>.
/// </summary>
public sealed class QueryBuilderTests
{
	/// <summary>
	/// Verifies Where with a single condition applies the filter.
	/// </summary>
	[Fact]
	public void Where_SingleCondition_AppliesFilter()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Charlie",
				Age = 35,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder =>
				builder.Where(entity => entity.Age > 28))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Alice");
		Assert.Contains(result, entity => entity.Name == "Charlie");
	}

	/// <summary>
	/// Verifies that multiple Where conditions are applied.
	/// </summary>
	[Fact]
	public void Where_MultipleConditions_AppliesAllFilters()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
				IsActive = true,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
				IsActive = false,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Charlie",
				Age = 35,
				IsActive = true,
			},
			new TestEntity
			{
				Id = 4,
				Name = "Diana",
				Age = 32,
				IsActive = false,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder =>
				builder
					.Where(entity => entity.Age > 28)
					.Where(entity => entity.IsActive))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Alice");
		Assert.Contains(result, entity => entity.Name == "Charlie");
	}

	/// <summary>
	/// Verifies OrderBy sorts results in ascending order.
	/// </summary>
	[Fact]
	public void OrderBy_AscendingOrder_SortsCorrectly()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Charlie",
				Age = 35,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Bob",
				Age = 25,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder =>
				builder.OrderBy(entity => entity.Name))
			.ToList();

		// Assert
		Assert.Equal(3, result.Count);
		Assert.Equal("Alice", result[0].Name);
		Assert.Equal("Bob", result[1].Name);
		Assert.Equal("Charlie", result[2].Name);
	}

	/// <summary>
	/// Verifies OrderByDescending sorts results in descending order.
	/// </summary>
	[Fact]
	public void OrderByDescending_DescendingOrder_SortsCorrectly()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Charlie",
				Age = 35,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder =>
				builder.OrderByDescending(entity => entity.Age))
			.ToList();

		// Assert
		Assert.Equal(3, result.Count);
		Assert.Equal(35, result[0].Age);
		Assert.Equal(30, result[1].Age);
		Assert.Equal(25, result[2].Age);
	}

	/// <summary>
	/// Verifies ThenBy applies a secondary sort as a tiebreaker.
	/// </summary>
	[Fact]
	public void ThenBy_SecondarySort_AppliesTieBreaker()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Charlie",
				Age = 30,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Bob",
				Age = 30,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder =>
				builder
					.OrderBy(entity => entity.Age)
					.ThenBy(entity => entity.Name))
			.ToList();

		// Assert
		Assert.Equal(3, result.Count);
		Assert.Equal("Alice", result[0].Name);
		Assert.Equal("Bob", result[1].Name);
		Assert.Equal("Charlie", result[2].Name);
	}

	/// <summary>
	/// Verifies Skip skips the specified number of items.
	/// </summary>
	[Fact]
	public void Skip_ValidCount_SkipsItems()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Charlie",
				Age = 35,
			},
			new TestEntity
			{
				Id = 4,
				Name = "Diana",
				Age = 28,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder => builder.Skip(2))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Charlie");
		Assert.Contains(result, entity => entity.Name == "Diana");
	}

	/// <summary>
	/// Verifies Take limits the results to the specified count.
	/// </summary>
	[Fact]
	public void Take_ValidCount_LimitsResults()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Charlie",
				Age = 35,
			},
			new TestEntity
			{
				Id = 4,
				Name = "Diana",
				Age = 28,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder => builder.Take(2))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
	}

	/// <summary>
	/// Verifies pagination returns correct page and size.
	/// </summary>
	[Fact]
	public void Paginate_ValidPageAndSize_ReturnsPaginatedResults()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Charlie",
				Age = 35,
			},
			new TestEntity
			{
				Id = 4,
				Name = "Diana",
				Age = 28,
			},
			new TestEntity
			{
				Id = 5,
				Name = "Eve",
				Age = 32,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder => builder.Paginate(2, 2))
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Contains(result, entity => entity.Name == "Charlie");
		Assert.Contains(result, entity => entity.Name == "Diana");
	}

	/// <summary>
	/// Verifies fluent chaining applies filters, sorts, and pagination.
	/// </summary>
	[Fact]
	public void FluentChaining_ComplexQuery_AppliesAllOperations()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
				IsActive = true,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
				IsActive = false,
			},
			new TestEntity
			{
				Id = 3,
				Name = "Charlie",
				Age = 35,
				IsActive = true,
			},
			new TestEntity
			{
				Id = 4,
				Name = "Diana",
				Age = 28,
				IsActive = true,
			},
			new TestEntity
			{
				Id = 5,
				Name = "Eve",
				Age = 32,
				IsActive = true,
			},
			new TestEntity
			{
				Id = 6,
				Name = "Frank",
				Age = 27,
				IsActive = false,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder =>
				builder
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

	/// <summary>
	/// Verifies that an empty builder returns all items.
	/// </summary>
	[Fact]
	public void EmptyBuilder_NoOperations_ReturnsAllItems()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity
			{
				Id = 1,
				Name = "Alice",
				Age = 30,
			},
			new TestEntity
			{
				Id = 2,
				Name = "Bob",
				Age = 25,
			},
		];

		// Act
		List<TestEntity> result =
			entities
			.AsQueryable()
			.ApplyQueryBuilder(builder => builder)
			.ToList();

		// Assert
		Assert.Equal(2, result.Count);
	}
}

public sealed class TestEntity
{
	public long Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public int Age { get; set; }
	public bool IsActive { get; set; }
}