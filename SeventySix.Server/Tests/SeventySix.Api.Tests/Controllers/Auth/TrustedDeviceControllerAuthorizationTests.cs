// <copyright file="TrustedDeviceControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Authorization tests for TrustedDeviceController endpoints.
/// Verifies that all endpoints require authentication.
/// </summary>
/// <remarks>
/// 80/20 Approach: Only tests the authorization boundary (401).
/// Business logic is tested by handler unit tests.
/// </remarks>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public sealed class TrustedDeviceControllerAuthorizationTests(
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
	// Unauthenticated Access Tests (401)
	// ============================================

	/// <summary>
	/// GET /api/v1/auth/trusted-devices requires authentication.
	/// </summary>
	[Fact]
	public Task GetDevicesAsync_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			ApiEndpoints.Auth.TrustedDevices.List);

	/// <summary>
	/// DELETE /api/v1/auth/trusted-devices/{deviceId} requires authentication.
	/// </summary>
	[Fact]
	public Task RevokeDeviceAsync_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Delete,
			ApiEndpoints.Auth.TrustedDevices.Revoke(1));

	/// <summary>
	/// DELETE /api/v1/auth/trusted-devices requires authentication.
	/// </summary>
	[Fact]
	public Task RevokeAllDevicesAsync_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Delete,
			ApiEndpoints.Auth.TrustedDevices.RevokeAll);
}