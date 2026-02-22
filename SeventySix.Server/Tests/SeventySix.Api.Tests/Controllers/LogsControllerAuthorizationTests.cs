// <copyright file="LogsControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Authorization tests for LogsController.
/// Tests that admin endpoints require proper authentication and admin role.
/// </summary>
[Collection(CollectionNames.LoggingPostgreSql)]
public sealed class LogsControllerAuthorizationTests(
	LoggingApiPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private const string Endpoint = ApiEndpoints.Logs.Base;
	private AuthorizationTestHelper AuthHelper =
		null!;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		await base.InitializeAsync();
		AuthHelper =
			new AuthorizationTestHelper(
			CreateClient(),
			SharedFactory.Services);
	}

	/// <summary>
	/// Tests that GET /api/v1/logs returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetPagedAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(HttpMethod.Get, Endpoint);

	/// <summary>
	/// Tests that DELETE /api/v1/logs/cleanup returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task CleanupLogsAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Delete,
			$"{Endpoint}/cleanup?cutoffDate=2024-01-01");

	/// <summary>
	/// Tests that GET /api/v1/logs returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task GetPagedAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Get,
			Endpoint);

	/// <summary>
	/// Tests that GET /api/v1/logs returns 403 for User role.
	/// This endpoint is Admin-only.
	/// </summary>
	[Fact]
	public Task GetPagedAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Get,
			Endpoint);

	/// <summary>
	/// Tests that GET /api/v1/logs returns 200 for Admin role.
	/// </summary>
	[Fact]
	public Task GetPagedAsync_WithAdminRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.Admin,
			HttpMethod.Get,
			Endpoint);
}