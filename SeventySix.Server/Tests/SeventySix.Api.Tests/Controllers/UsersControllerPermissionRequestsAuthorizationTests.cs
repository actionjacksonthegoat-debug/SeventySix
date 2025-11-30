// <copyright file="UsersControllerPermissionRequestsAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using SeventySix.Identity;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Xunit;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Authorization tests for permission request endpoints on UsersController.
/// Focus: Authorization boundaries only (80/20).
/// </summary>
[Collection("PostgreSQL")]
public class UsersControllerPermissionRequestsAuthorizationTests(
	TestcontainersPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private const string BaseEndpoint = "/api/v1/users";
	private AuthorizationTestHelper AuthHelper = null!;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		await base.InitializeAsync();
		AuthHelper =
			new AuthorizationTestHelper(CreateClient(), SharedFactory.Services);
	}

	#region GetPermissionRequests (Admin only)

	/// <summary>
	/// Tests that GET /api/v1/users/permission-requests returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			$"{BaseEndpoint}/permission-requests");

	/// <summary>
	/// Tests that GET /api/v1/users/permission-requests returns 403 for User role.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithUserRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Get,
			$"{BaseEndpoint}/permission-requests");

	/// <summary>
	/// Tests that GET /api/v1/users/permission-requests returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithDeveloperRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync(
			"Developer",
			HttpMethod.Get,
			$"{BaseEndpoint}/permission-requests");

	/// <summary>
	/// Tests that GET /api/v1/users/permission-requests returns 200 for Admin role.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithAdminRole_ReturnsOkAsync()
		=> AuthHelper.AssertAuthorizedForRoleAsync(
			"Admin",
			HttpMethod.Get,
			$"{BaseEndpoint}/permission-requests");

	#endregion

	#region GetAvailableRoles (Authenticated users)

	/// <summary>
	/// Tests that GET /api/v1/users/me/available-roles returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetAvailableRolesAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			$"{BaseEndpoint}/me/available-roles");

	/// <summary>
	/// Tests that GET /api/v1/users/me/available-roles returns 200 for User role.
	/// </summary>
	[Fact]
	public Task GetAvailableRolesAsync_WithUserRole_ReturnsOkAsync()
		=> AuthHelper.AssertAuthorizedForRoleAsync(
			"User",
			HttpMethod.Get,
			$"{BaseEndpoint}/me/available-roles");

	#endregion

	#region CreatePermissionRequests (Authenticated users)

	/// <summary>
	/// Tests that POST /api/v1/users/me/permission-requests returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task CreatePermissionRequestsAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			$"{BaseEndpoint}/me/permission-requests",
			JsonContent.Create(new CreatePermissionRequestDto(["Developer"])));

	/// <summary>
	/// Tests that POST /api/v1/users/me/permission-requests returns 204 for User role with valid request.
	/// </summary>
	[Fact]
	public Task CreatePermissionRequestsAsync_WithUserRole_ReturnsNoContentAsync()
		=> AuthHelper.AssertStatusCodeForRoleAsync(
			"User",
			HttpMethod.Post,
			$"{BaseEndpoint}/me/permission-requests",
			HttpStatusCode.NoContent,
			JsonContent.Create(new CreatePermissionRequestDto(["Developer"], "Need access")));

	#endregion
}
