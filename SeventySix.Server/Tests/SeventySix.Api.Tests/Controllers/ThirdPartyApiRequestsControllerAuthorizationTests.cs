// <copyright file="ThirdPartyApiRequestsControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Xunit;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Authorization tests for ThirdPartyApiRequestsController.
/// Tests that admin endpoints require proper authentication and admin role.
/// </summary>
[Collection("PostgreSQL")]
public class ThirdPartyApiRequestsControllerAuthorizationTests(TestcontainersPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private const string Endpoint = "/api/v1/thirdpartyrequests";
	private AuthorizationTestHelper AuthHelper = null!;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		await base.InitializeAsync();
		AuthHelper =
			new AuthorizationTestHelper(CreateClient(), SharedFactory.Services);
	}

	/// <summary>
	/// Tests that GET /api/v1/thirdpartyrequests returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetPagedAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(HttpMethod.Get, Endpoint);

	/// <summary>
	/// Tests that GET /api/v1/thirdpartyrequests returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task GetPagedAsync_WithDeveloperRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync("Developer", HttpMethod.Get, Endpoint);

	/// <summary>
	/// Tests that GET /api/v1/thirdpartyrequests returns 200 for Admin role.
	/// </summary>
	[Fact]
	public Task GetPagedAsync_WithAdminRole_ReturnsOkAsync()
		=> AuthHelper.AssertAuthorizedForRoleAsync("Admin", HttpMethod.Get, Endpoint);
}
