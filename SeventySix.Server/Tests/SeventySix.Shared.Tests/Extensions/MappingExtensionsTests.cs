// <copyright file="MappingExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Extensions;
using Shouldly;

namespace SeventySix.Shared.Tests.Extensions;

/// <summary>
/// Unit tests for MappingExtensions generic mapping utilities.
/// </summary>
public sealed class MappingExtensionsTests
{
	[Fact]
	public void MapToDto_ValidEntities_MapsCorrectly()
	{
		// Arrange
		List<TestEntity> entities =
			[
			new TestEntity { Id = 1, Name = "First" },
			new TestEntity { Id = 2, Name = "Second" },
			new TestEntity { Id = 3, Name = "Third" },
		];

		// Act
		IEnumerable<TestDto> result =
			entities.MapToDto(entity => new TestDto
			{
				Id = entity.Id,
				DisplayName = entity.Name.ToUpper(),
			});

		// Assert
		List<TestDto> resultList = result.ToList();
		resultList.Count.ShouldBe(3);
		resultList[0].Id.ShouldBe(1);
		resultList[0].DisplayName.ShouldBe("FIRST");
		resultList[1].Id.ShouldBe(2);
		resultList[1].DisplayName.ShouldBe("SECOND");
	}

	[Fact]
	public void MapToDto_EmptyCollection_ReturnsEmpty()
	{
		// Arrange
		List<TestEntity> entities = [];

		// Act
		IEnumerable<TestDto> result =
			entities.MapToDto(entity => new TestDto
			{
				Id = entity.Id,
				DisplayName = entity.Name,
			});

		// Assert
		result.ShouldBeEmpty();
	}

	[Fact]
	public void MapToDto_NullCollection_ThrowsArgumentNullException()
	{
		// Arrange
		IEnumerable<TestEntity>? entities = null;

		// Act & Assert
		Should.Throw<ArgumentNullException>(
			() =>
				entities!.MapToDto(
					entity => new TestDto
					{
						Id = entity.Id,
						DisplayName = entity.Name,
					}));
	}

	[Fact]
	public void MapToDto_NullMapper_ThrowsArgumentNullException()
	{
		// Arrange
		List<TestEntity> entities =
			[new TestEntity { Id = 1, Name = "Test" }];
		Func<TestEntity, TestDto>? mapper = null;

		// Act & Assert
		Should.Throw<ArgumentNullException>(
			() => entities.MapToDto(mapper!));
	}

	[Fact]
	public void MapToDto_DeferredExecution_OnlyEvaluatesWhenEnumerated()
	{
		// Arrange
		int mapperCallCount = 0;
		List<TestEntity> entities =
			[new TestEntity { Id = 1, Name = "Test" }];

		// Act - just calling MapToDto shouldn't execute mapper
		IEnumerable<TestDto> result =
			entities.MapToDto(
				entity =>
					{
						mapperCallCount++;
						return new TestDto { Id = entity.Id, DisplayName = entity.Name };
					});

		// Assert - no calls yet (deferred execution)
		mapperCallCount.ShouldBe(0);

		// Enumerate
		List<TestDto> materialized = result.ToList();

		// Assert - now mapper was called
		mapperCallCount.ShouldBe(1);
		materialized.ShouldHaveSingleItem();
	}

	private class TestEntity
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
	}

	private class TestDto
	{
		public int Id { get; set; }
		public string DisplayName { get; set; } = string.Empty;
	}
}