// <copyright file="PermissionRequestsControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Json;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Authorization tests for PermissionRequestsController.
/// Verifies that admin-only endpoints require proper authentication and admin role.
/// </summary>
[Collection(CollectionNames.IdentityHealthPostgreSql)]
public sealed class PermissionRequestsControllerAuthorizationTests(
	IdentityHealthApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	/// <summary>
	/// Test permission request ID for approval/rejection operations.
	/// </summary>
	private const long TestRequestId = 1;

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

	#region GET /users/permission-requests (Admin Only)

	/// <summary>
	/// Tests that GET /users/permission-requests returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			ApiEndpoints.PermissionRequests.Base);

	/// <summary>
	/// Tests that GET /users/permission-requests returns 403 for User role.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Get,
			ApiEndpoints.PermissionRequests.Base);

	/// <summary>
	/// Tests that GET /users/permission-requests returns 403 for Developer role.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Get,
			ApiEndpoints.PermissionRequests.Base);

	/// <summary>
	/// Tests that GET /users/permission-requests returns 200 for Admin role.
	/// </summary>
	[Fact]
	public Task GetPermissionRequestsAsync_WithAdminRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.Admin,
			HttpMethod.Get,
			ApiEndpoints.PermissionRequests.Base);

	#endregion

	#region POST /users/permission-requests/{id}/approve (Admin Only)

	/// <summary>
	/// Tests that POST /users/permission-requests/{id}/approve returns 401 without auth.
	/// </summary>
	[Fact]
	public Task ApprovePermissionRequestAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.Approve(TestRequestId));

	/// <summary>
	/// Tests that POST /users/permission-requests/{id}/approve returns 403 for User role.
	/// </summary>
	[Fact]
	public Task ApprovePermissionRequestAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.Approve(TestRequestId));

	/// <summary>
	/// Tests that POST /users/permission-requests/{id}/approve returns 403 for Developer.
	/// </summary>
	[Fact]
	public Task ApprovePermissionRequestAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.Approve(TestRequestId));

	#endregion

	#region POST /users/permission-requests/{id}/reject (Admin Only)

	/// <summary>
	/// Tests that POST /users/permission-requests/{id}/reject returns 401 without auth.
	/// </summary>
	[Fact]
	public Task RejectPermissionRequestAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.Reject(TestRequestId));

	/// <summary>
	/// Tests that POST /users/permission-requests/{id}/reject returns 403 for User role.
	/// </summary>
	[Fact]
	public Task RejectPermissionRequestAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.Reject(TestRequestId));

	/// <summary>
	/// Tests that POST /users/permission-requests/{id}/reject returns 403 for Developer.
	/// </summary>
	[Fact]
	public Task RejectPermissionRequestAsync_WithDeveloperRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.Reject(TestRequestId));

	#endregion

	#region POST /users/permission-requests/bulk/approve (Admin Only)

	/// <summary>
	/// Tests that POST /users/permission-requests/bulk/approve returns 401 without auth.
	/// </summary>
	[Fact]
	public Task BulkApproveAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.BulkApprove,
			JsonContent.Create(new long[] { 1, 2 }));

	/// <summary>
	/// Tests that POST /users/permission-requests/bulk/approve returns 403 for User role.
	/// </summary>
	[Fact]
	public Task BulkApproveAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.BulkApprove,
			JsonContent.Create(new long[] { 1, 2 }));

	#endregion

	#region POST /users/permission-requests/bulk/reject (Admin Only)

	/// <summary>
	/// Tests that POST /users/permission-requests/bulk/reject returns 401 without auth.
	/// </summary>
	[Fact]
	public Task BulkRejectAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.BulkReject,
			JsonContent.Create(new long[] { 1, 2 }));

	/// <summary>
	/// Tests that POST /users/permission-requests/bulk/reject returns 403 for User role.
	/// </summary>
	[Fact]
	public Task BulkRejectAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Post,
			ApiEndpoints.PermissionRequests.BulkReject,
			JsonContent.Create(new long[] { 1, 2 }));

	#endregion

	#region User-Only Endpoints (Authenticated but not Admin)

	/// <summary>
	/// Tests that GET /users/me/available-roles returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetAvailableRolesAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			ApiEndpoints.Users.MeAvailableRoles);

	/// <summary>
	/// Tests that GET /users/me/available-roles returns 200 for User role.
	/// </summary>
	[Fact]
	public Task GetAvailableRolesAsync_WithUserRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Get,
			ApiEndpoints.Users.MeAvailableRoles);

	/// <summary>
	/// Tests that POST /users/me/permission-requests returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task CreatePermissionRequestAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.Users.MePermissionRequests,
			JsonContent.Create(new { RequestedRoles = new[] { "Developer" } }));

	#endregion
}