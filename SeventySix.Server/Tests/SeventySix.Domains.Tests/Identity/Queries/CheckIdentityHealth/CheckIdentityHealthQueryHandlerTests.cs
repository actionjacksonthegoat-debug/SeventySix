// <copyright file="CheckIdentityHealthQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Queries.CheckIdentityHealth;

/// <summary>
/// Integration tests for <see cref="CheckIdentityHealthQueryHandler"/>.
/// Tests require database connection to verify health check functionality.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests critical health check logic for system monitoring.
/// Infrastructure: Verifies database connectivity and exception handling.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public class CheckIdentityHealthQueryHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	/// <summary>
	/// Tests that health check returns true when database is healthy.
	/// </summary>
	[Fact]
	public async Task HandleAsync_HealthyDatabase_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		CheckIdentityHealthQuery query =
			new();

		// Act
		bool result =
			await CheckIdentityHealthQueryHandler.HandleAsync(
				query,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}
}