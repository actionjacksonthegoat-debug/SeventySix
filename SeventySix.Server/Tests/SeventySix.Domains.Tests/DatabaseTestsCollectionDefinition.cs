// <copyright file="DatabaseTestsCollectionDefinition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Domains.Tests;

/// <summary>
/// Defines the DatabaseTests collection for xUnit test parallelization.
/// All tests in this collection share the same TestcontainersPostgreSqlFixture instance.
/// </summary>
[CollectionDefinition("DatabaseTests")]
public class DatabaseTestsCollectionDefinition : ICollectionFixture<TestcontainersPostgreSqlFixture>
{
	// This class has no code, and is never instantiated. Its purpose is simply
	// to be the place to apply [CollectionDefinition] and all the ICollectionFixture<> interfaces.
}