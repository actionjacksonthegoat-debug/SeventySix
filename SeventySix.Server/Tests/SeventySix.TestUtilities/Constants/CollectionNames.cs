// <copyright file="CollectionNames.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.Constants;

/// <summary>
/// Centralized collection name constants for xUnit test collections.
/// Prevents magic strings and ensures consistency across all test projects.
/// </summary>
public static class CollectionNames
{
	/// <summary>
	/// Collection name for PostgreSQL integration tests.
	/// All tests using this collection share the same PostgreSQL container instance.
	/// </summary>
	public const string PostgreSql = "PostgreSQL";
}
