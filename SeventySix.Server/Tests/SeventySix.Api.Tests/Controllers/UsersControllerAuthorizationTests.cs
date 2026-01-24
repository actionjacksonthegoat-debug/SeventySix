// <copyright file="UsersControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Authorization tests for UsersController.
/// Tests that admin endpoints require proper authentication and admin role.
/// </summary>
[Collection(CollectionNames.PostgreSql)]
public class UsersControllerAuthorizationTests(
	TestcontainersPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private const string Endpoint = ApiEndpoints.Users.Base;
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

	#region Unauthenticated Access Tests (401)

	/// <summary>
	/// Tests that GET /api/v1/users returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetAllAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(HttpMethod.Get, Endpoint);

	/// <summary>
	/// Tests that GET /api/v1/users/{id} returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetByIdAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			$"{Endpoint}/1");

	/// <summary>
	/// Tests that POST /api/v1/users returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task CreateAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			Endpoint,
			JsonContent.Create(
				new
				{
					Username = "test",
					Email = "test@test.com",
					Password = "Test123!",
				}));

	/// <summary>
	/// Tests that PUT /api/v1/users/{id} returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task UpdateAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Put,
			$"{Endpoint}/1",
			JsonContent.Create(
				new { Username = "test", Email = "test@test.com" }));

	/// <summary>
	/// Tests that DELETE /api/v1/users/{id} returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task DeleteAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Delete,
			$"{Endpoint}/1");

	#endregion

	#region Developer Role Access Tests (403)

	/// <summary>
	/// Tests that GET /api/v1/users returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task GetAllAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Get,
			Endpoint);

	/// <summary>
	/// Tests that DELETE /api/v1/users/{id} returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task DeleteAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Delete,
			$"{Endpoint}/1");

	#endregion

	#region User Role Access Tests (403)

	/// <summary>
	/// Tests that GET /api/v1/users returns 403 for User role.
	/// This endpoint is Admin-only.
	/// </summary>
	[Fact]
	public Task GetAllAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Get,
			Endpoint);

	/// <summary>
	/// Tests that DELETE /api/v1/users/{id} returns 403 for User role.
	/// This endpoint is Admin-only.
	/// </summary>
	[Fact]
	public Task DeleteAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Delete,
			$"{Endpoint}/1");

	#endregion

	#region Admin Role Access Tests (200)

	/// <summary>
	/// Tests that GET /api/v1/users returns 200 for Admin role.
	/// </summary>
	[Fact]
	public Task GetAllAsync_WithAdminRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.Admin,
			HttpMethod.Get,
			Endpoint);

	/// <summary>
	/// Tests that GET /api/v1/users/{id} returns 404 for Admin role (auth passed, resource not found).
	/// </summary>
	[Fact]
	public Task GetByIdAsync_WithAdminRole_ReturnsNotFoundAsync() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			TestRoleConstants.Admin,
			HttpMethod.Get,
			$"{Endpoint}/99999",
			HttpStatusCode.NotFound);

	#endregion
}