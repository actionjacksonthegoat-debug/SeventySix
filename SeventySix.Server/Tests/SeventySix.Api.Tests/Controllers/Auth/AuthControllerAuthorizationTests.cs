// <copyright file="AuthControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Json;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Authorization tests for AuthController.
/// Tests that protected endpoints require proper authentication.
/// Per 80/20 rule: Focus on security-critical endpoints that require [Authorize].
/// </summary>
[Collection(CollectionNames.PostgreSql)]
public sealed class AuthControllerAuthorizationTests(
	TestcontainersPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
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

	// ============================================
	// GET /api/v1/auth/me - [Authorize] endpoint
	// ============================================

	/// <summary>
	/// Tests that GET /api/v1/auth/me returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetCurrentUser_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			ApiEndpoints.Auth.Me);

	/// <summary>
	/// Tests that GET /api/v1/auth/me returns 200 for User role.
	/// All authenticated users should be able to get their own info.
	/// </summary>
	[Fact]
	public Task GetCurrentUser_WithUserRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Get,
			ApiEndpoints.Auth.Me);

	/// <summary>
	/// Tests that GET /api/v1/auth/me returns 200 for Developer role.
	/// </summary>
	[Fact]
	public Task GetCurrentUser_WithDeveloperRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Get,
			ApiEndpoints.Auth.Me);

	/// <summary>
	/// Tests that GET /api/v1/auth/me returns 200 for Admin role.
	/// </summary>
	[Fact]
	public Task GetCurrentUser_WithAdminRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.Admin,
			HttpMethod.Get,
			ApiEndpoints.Auth.Me);

	// ============================================
	// POST /api/v1/auth/change-password - [Authorize] endpoint
	// ============================================

	/// <summary>
	/// Tests that POST /api/v1/auth/change-password returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task ChangePassword_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.Auth.ChangePassword);

	/// <summary>
	/// Tests that POST /api/v1/auth/change-password returns 400 (validation error)
	/// for authenticated User role (endpoint is accessible, request body is invalid).
	/// This confirms the endpoint requires auth but allows all authenticated users.
	/// </summary>
	[Fact]
	public Task ChangePassword_WithUserRole_IsAccessibleAsync() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Post,
			ApiEndpoints.Auth.ChangePassword,
			System.Net.HttpStatusCode.BadRequest,
			JsonContent.Create(new { })); // Empty JSON to get validation error, not 415

	// ============================================
	// POST /api/v1/auth/logout - Cookie-based, no [Authorize]
	// ============================================

	/// <summary>
	/// Tests that POST /api/v1/auth/logout returns 200 even without authentication.
	/// Logout is designed to clear cookies regardless of auth state.
	/// </summary>
	[Fact]
	public async Task Logout_WithoutAuth_ReturnsOkAsync()
	{
		// Arrange
		HttpClient client =
			CreateClient();

		// Act
		HttpResponseMessage response =
			await client.PostAsync(
				ApiEndpoints.Auth.Logout,
				null);

		// Assert - Logout always succeeds (clears cookies)
		response.IsSuccessStatusCode.ShouldBeTrue();
	}

	// ============================================
	// POST /api/v1/auth/refresh - Cookie-based, no [Authorize]
	// ============================================

	/// <summary>
	/// Tests that POST /api/v1/auth/refresh returns 401 without valid refresh token cookie.
	/// This endpoint relies on cookie-based auth, not JWT header.
	/// </summary>
	[Fact]
	public async Task Refresh_WithoutRefreshToken_ReturnsUnauthorizedAsync()
	{
		// Arrange
		HttpClient client =
			CreateClient();

		// Act
		HttpResponseMessage response =
			await client.PostAsync(
				ApiEndpoints.Auth.Refresh,
				null);

		// Assert - No refresh token cookie = 401
		response.StatusCode.ShouldBe(System.Net.HttpStatusCode.Unauthorized);
	}
}
