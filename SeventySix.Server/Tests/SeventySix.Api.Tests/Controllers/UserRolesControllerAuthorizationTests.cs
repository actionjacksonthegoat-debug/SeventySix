// <copyright file="UserRolesControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Authorization tests for UserRolesController.
/// Verifies that admin-only endpoints require proper authentication and admin role.
/// </summary>
[Collection(CollectionNames.IdentityUsersPostgreSql)]
public class UserRolesControllerAuthorizationTests(
	IdentityUsersApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	/// <summary>
	/// Test user ID for role operations.
	/// </summary>
	private const long TestUserId = 1;

	/// <summary>
	/// Test role name for add/remove operations.
	/// </summary>
	private const string TestRole = "Developer";

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
	/// Tests that GET /users/{id}/roles returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetUserRolesAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			ApiEndpoints.UserRoles.ById(TestUserId));

	/// <summary>
	/// Tests that GET /users/{id}/roles returns 403 for User role.
	/// </summary>
	[Fact]
	public Task GetUserRolesAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Get,
			ApiEndpoints.UserRoles.ById(TestUserId));

	/// <summary>
	/// Tests that GET /users/{id}/roles returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task GetUserRolesAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Get,
			ApiEndpoints.UserRoles.ById(TestUserId));

	/// <summary>
	/// Tests that POST /users/{id}/roles/{role} returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task AddUserRoleAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.UserRoles.AddRole(TestUserId, TestRole));

	/// <summary>
	/// Tests that POST /users/{id}/roles/{role} returns 403 for User role.
	/// </summary>
	[Fact]
	public Task AddUserRoleAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Post,
			ApiEndpoints.UserRoles.AddRole(TestUserId, TestRole));

	/// <summary>
	/// Tests that POST /users/{id}/roles/{role} returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task AddUserRoleAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Post,
			ApiEndpoints.UserRoles.AddRole(TestUserId, TestRole));

	/// <summary>
	/// Tests that DELETE /users/{id}/roles/{role} returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task RemoveUserRoleAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Delete,
			ApiEndpoints.UserRoles.RemoveRole(TestUserId, TestRole));

	/// <summary>
	/// Tests that DELETE /users/{id}/roles/{role} returns 403 for User role.
	/// </summary>
	[Fact]
	public Task RemoveUserRoleAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Delete,
			ApiEndpoints.UserRoles.RemoveRole(TestUserId, TestRole));

	/// <summary>
	/// Tests that DELETE /users/{id}/roles/{role} returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task RemoveUserRoleAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Delete,
			ApiEndpoints.UserRoles.RemoveRole(TestUserId, TestRole));
}