// <copyright file="UsersControllerRolesTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for user role management endpoints.
/// Focus: Authorization boundaries (80/20).
/// </summary>
[Collection(CollectionNames.PostgreSql)]
public class UsersControllerRolesTests(TestcontainersPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture),
		IAsyncLifetime
{
	private const string BaseEndpoint = "/api/v1/users";
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

	#region GetUserRoles Authorization

	[Fact]
	public Task GetUserRolesAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			$"{BaseEndpoint}/1/roles");

	[Fact]
	public Task GetUserRolesAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Get,
			$"{BaseEndpoint}/1/roles");

	[Fact]
	public Task GetUserRolesAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			"Developer",
			HttpMethod.Get,
			$"{BaseEndpoint}/1/roles");

	[Fact]
	public Task GetUserRolesAsync_WithAdminRole_UserNotFound_Returns404Async() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Get,
			$"{BaseEndpoint}/999/roles",
			HttpStatusCode.NotFound);

	[Fact]
	public Task GetUserRolesAsync_WithAdminRole_ValidUser_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			"Admin",
			HttpMethod.Get,
			$"{BaseEndpoint}/1/roles");

	#endregion

	#region AddUserRole Authorization

	[Fact]
	public Task AddUserRoleAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			$"{BaseEndpoint}/1/roles/Developer");

	[Fact]
	public Task AddUserRoleAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Post,
			$"{BaseEndpoint}/1/roles/Developer");

	[Fact]
	public Task AddUserRoleAsync_WithAdminRole_UserNotFound_Returns404Async() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Post,
			$"{BaseEndpoint}/999/roles/Developer",
			HttpStatusCode.NotFound);

	[Fact]
	public Task AddUserRoleAsync_WithAdminRole_InvalidRole_Returns400Async() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Post,
			$"{BaseEndpoint}/1/roles/InvalidRole",
			HttpStatusCode.BadRequest);

	[Fact]
	public Task AddUserRoleAsync_WithAdminRole_AlreadyHasRole_Returns409Async() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Post,
			$"{BaseEndpoint}/1/roles/Admin",
			HttpStatusCode.Conflict);

	#endregion

	#region RemoveUserRole Authorization

	[Fact]
	public Task RemoveUserRoleAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Delete,
			$"{BaseEndpoint}/1/roles/Developer");

	[Fact]
	public Task RemoveUserRoleAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Delete,
			$"{BaseEndpoint}/1/roles/Developer");

	[Fact]
	public Task RemoveUserRoleAsync_WithAdminRole_UserNotFound_Returns404Async() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Delete,
			$"{BaseEndpoint}/999/roles/Developer",
			HttpStatusCode.NotFound);

	[Fact]
	public Task RemoveUserRoleAsync_WithAdminRole_RoleNotFound_Returns404Async() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Delete,
			$"{BaseEndpoint}/1/roles/Developer",
			HttpStatusCode.NotFound);

	#endregion
}