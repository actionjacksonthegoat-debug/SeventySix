// <copyright file="MappingExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Extensions;

namespace SeventySix.Tests.Shared.Extensions;

/// <summary>
/// Unit tests for MappingExtensions generic mapping utilities.
/// </summary>
public class MappingExtensionsTests
{
	[Fact]
	public void MapToDto_ValidEntities_MapsCorrectly()
	{
		// Arrange
		List<TestEntity> entities =
		[
			new TestEntity { Id = 1, Name = "First" },
			new TestEntity { Id = 2, Name = "Second" },
			new TestEntity { Id = 3, Name = "Third" }
		];

		// Act
		IEnumerable<TestDto> result = entities.MapToDto(e => new TestDto
		{
			Id = e.Id,
			DisplayName = e.Name.ToUpper()
		});

		// Assert
		List<TestDto> resultList = result.ToList();
		Assert.Equal(3, resultList.Count);
		Assert.Equal(1, resultList[0].Id);
		Assert.Equal("FIRST", resultList[0].DisplayName);
		Assert.Equal(2, resultList[1].Id);
		Assert.Equal("SECOND", resultList[1].DisplayName);
	}

	[Fact]
	public void MapToDto_EmptyCollection_ReturnsEmpty()
	{
		// Arrange
		List<TestEntity> entities = [];

		// Act
		IEnumerable<TestDto> result = entities.MapToDto(e => new TestDto
		{
			Id = e.Id,
			DisplayName = e.Name
		});

		// Assert
		Assert.Empty(result);
	}

	[Fact]
	public void MapToDto_NullCollection_ThrowsArgumentNullException()
	{
		// Arrange
		IEnumerable<TestEntity>? entities = null;

		// Act & Assert
		Assert.Throws<ArgumentNullException>(() =>
			entities!.MapToDto(e => new TestDto { Id = e.Id, DisplayName = e.Name }));
	}

	[Fact]
	public void MapToDto_NullMapper_ThrowsArgumentNullException()
	{
		// Arrange
		List<TestEntity> entities = [new TestEntity { Id = 1, Name = "Test" }];
		Func<TestEntity, TestDto>? mapper = null;

		// Act & Assert
		Assert.Throws<ArgumentNullException>(() => entities.MapToDto(mapper!));
	}

	[Fact]
	public void MapToDto_DeferredExecution_OnlyEvaluatesWhenEnumerated()
	{
		// Arrange
		int mapperCallCount = 0;
		List<TestEntity> entities = [new TestEntity { Id = 1, Name = "Test" }];

		// Act - just calling MapToDto shouldn't execute mapper
		IEnumerable<TestDto> result = entities.MapToDto(e =>
		{
			mapperCallCount++;
			return new TestDto { Id = e.Id, DisplayName = e.Name };
		});

		// Assert - no calls yet (deferred execution)
		Assert.Equal(0, mapperCallCount);

		// Enumerate
		List<TestDto> materialized = result.ToList();

		// Assert - now mapper was called
		Assert.Equal(1, mapperCallCount);
		Assert.Single(materialized);
	}

	private class TestEntity
	{
		public int Id
		{
			get; set;
		}
		public string Name { get; set; } = string.Empty;
	}

	private class TestDto
	{
		public int Id
		{
			get; set;
		}
		public string DisplayName { get; set; } = string.Empty;
	}
}