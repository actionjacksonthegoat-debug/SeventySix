// <copyright file="UsersControllerPermissionApprovalTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Xunit;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for permission request approval/rejection endpoints.
/// Focus: Authorization boundaries (80/20).
/// </summary>
[Collection("PostgreSQL")]
public class UsersControllerPermissionApprovalTests(
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

	#region ApprovePermissionRequest Authorization

	[Fact]
	public Task ApprovePermissionRequestAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/1/approve");

	[Fact]
	public Task ApprovePermissionRequestAsync_WithUserRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/1/approve");

	[Fact]
	public Task ApprovePermissionRequestAsync_WithDeveloperRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync(
			"Developer",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/1/approve");

	[Fact]
	public Task ApprovePermissionRequestAsync_WithAdminRole_NotFound_Returns404Async()
		=> AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/999/approve",
			HttpStatusCode.NotFound);

	#endregion

	#region RejectPermissionRequest Authorization

	[Fact]
	public Task RejectPermissionRequestAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/1/reject");

	[Fact]
	public Task RejectPermissionRequestAsync_WithUserRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/1/reject");

	[Fact]
	public Task RejectPermissionRequestAsync_WithAdminRole_NotFound_Returns404Async()
		=> AuthHelper.AssertStatusCodeForRoleAsync(
			"Admin",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/999/reject",
			HttpStatusCode.NotFound);

	#endregion

	#region BulkApprove Authorization

	[Fact]
	public Task BulkApprovePermissionRequestsAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/bulk/approve",
			JsonContent.Create(new[] { 1, 2 }));

	[Fact]
	public Task BulkApprovePermissionRequestsAsync_WithUserRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/bulk/approve",
			JsonContent.Create(new[] { 1, 2 }));

	[Fact]
	public Task BulkApprovePermissionRequestsAsync_WithAdminRole_ReturnsOkAsync()
		=> AuthHelper.AssertAuthorizedForRoleAsync(
			"Admin",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/bulk/approve",
			JsonContent.Create(Array.Empty<int>()));

	#endregion

	#region BulkReject Authorization

	[Fact]
	public Task BulkRejectPermissionRequestsAsync_WithoutAuth_ReturnsUnauthorizedAsync()
		=> AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/bulk/reject",
			JsonContent.Create(new[] { 1, 2 }));

	[Fact]
	public Task BulkRejectPermissionRequestsAsync_WithUserRole_ReturnsForbiddenAsync()
		=> AuthHelper.AssertForbiddenForRoleAsync(
			"User",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/bulk/reject",
			JsonContent.Create(new[] { 1, 2 }));

	[Fact]
	public Task BulkRejectPermissionRequestsAsync_WithAdminRole_ReturnsOkAsync()
		=> AuthHelper.AssertAuthorizedForRoleAsync(
			"Admin",
			HttpMethod.Post,
			$"{BaseEndpoint}/permission-requests/bulk/reject",
			JsonContent.Create(Array.Empty<int>()));

	#endregion
}