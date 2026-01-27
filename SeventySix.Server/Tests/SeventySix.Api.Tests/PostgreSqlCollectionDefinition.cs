// <copyright file="PostgreSqlCollectionDefinition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests;

/// <summary>
/// Defines the PostgreSQL collection for xUnit test parallelization.
/// All tests in this collection share the same TestcontainersPostgreSqlFixture instance.
/// </summary>
/// <remarks>
/// xUnit requires collection definitions to be in the same assembly as the tests.
/// Use <c>[Collection(CollectionNames.PostgreSql)]</c> on test classes.
/// </remarks>
[CollectionDefinition(CollectionNames.PostgreSql)]
public class PostgreSqlCollectionDefinition
	: ICollectionFixture<TestcontainersPostgreSqlFixture>
{
	// This class has no code, and is never instantiated. Its purpose is simply
	// to be the place to apply [CollectionDefinition] and all the ICollectionFixture<> interfaces.
}