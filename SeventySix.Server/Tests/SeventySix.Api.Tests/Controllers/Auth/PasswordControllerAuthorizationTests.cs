// <copyright file="PasswordControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Json;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Authorization tests for PasswordController.
/// Tests that protected password endpoints require proper authentication.
/// Per 80/20 rule: Focus on security-critical endpoints that require [Authorize].
/// </summary>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public sealed class PasswordControllerAuthorizationTests(
	IdentityAuthApiPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
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
	// POST /api/v1/auth/password/change - [Authorize] endpoint
	// ============================================

	/// <summary>
	/// Tests that POST /api/v1/auth/password/change returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task ChangePassword_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.Auth.Password.Change);

	/// <summary>
	/// Tests that POST /api/v1/auth/password/change returns 400 (validation error)
	/// for authenticated User role (endpoint is accessible, request body is invalid).
	/// This confirms the endpoint requires auth but allows all authenticated users.
	/// </summary>
	[Fact]
	public Task ChangePassword_WithUserRole_IsAccessibleAsync() =>
		AuthHelper.AssertStatusCodeForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Post,
			ApiEndpoints.Auth.Password.Change,
			System.Net.HttpStatusCode.BadRequest,
			JsonContent.Create(new { })); // Empty JSON to get validation error, not 415
}