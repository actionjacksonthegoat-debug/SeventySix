// <copyright file="QueryableExtensionsUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Persistence;
using Shouldly;

namespace SeventySix.Shared.Tests.Persistence;

/// <summary>
/// Unit tests for <see cref="QueryableExtensions"/>.
/// </summary>
public sealed class QueryableExtensionsUnitTests
{
	[Fact]
	public void WhereIf_ConditionTrue_AppliesPredicate()
	{
		// Arrange
		IQueryable<int> source =
			new[] { 1, 2, 3, 4, 5 }.AsQueryable();

		// Act
		List<int> result =
			source
				.WhereIf(
					true,
					x => x > 3)
				.ToList();

		// Assert
		result.ShouldBe([4, 5]);
	}

	[Fact]
	public void WhereIf_ConditionFalse_ReturnsOriginalQuery()
	{
		// Arrange
		IQueryable<int> source =
			new[] { 1, 2, 3, 4, 5 }.AsQueryable();

		// Act
		List<int> result =
			source
				.WhereIf(
					false,
					x => x > 3)
				.ToList();

		// Assert
		result.ShouldBe([1, 2, 3, 4, 5]);
	}
}