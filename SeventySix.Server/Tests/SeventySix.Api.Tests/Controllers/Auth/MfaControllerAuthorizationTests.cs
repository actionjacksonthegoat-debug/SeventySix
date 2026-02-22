// <copyright file="MfaControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Authorization tests for MfaController endpoints.
/// Verifies that authenticated endpoints reject anonymous requests
/// and MFA verification (pre-auth) endpoints accept anonymous requests.
/// </summary>
/// <remarks>
/// 80/20 Approach: Only tests the authorization boundary (401/non-401).
/// MFA logic is tested by handler unit tests.
/// </remarks>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public sealed class MfaControllerAuthorizationTests(
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
	// Authenticated endpoints (must reject anonymous)
	// ============================================

	/// <summary>
	/// TOTP setup requires authentication.
	/// </summary>
	[Fact]
	public Task TotpSetup_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.Auth.Mfa.TotpSetup);

	/// <summary>
	/// TOTP confirm requires authentication.
	/// </summary>
	[Fact]
	public Task TotpConfirm_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.Auth.Mfa.TotpConfirm,
			JsonContent.Create(new { Code = "000000" }));

	/// <summary>
	/// TOTP disable requires authentication.
	/// </summary>
	[Fact]
	public Task TotpDisable_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.Auth.Mfa.TotpDisable);

	/// <summary>
	/// Backup code generation requires authentication.
	/// </summary>
	[Fact]
	public Task GenerateBackupCodes_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Post,
			ApiEndpoints.Auth.Mfa.BackupCodes);

	/// <summary>
	/// Backup codes remaining count requires authentication.
	/// </summary>
	[Fact]
	public Task GetBackupCodesRemaining_Anonymous_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			ApiEndpoints.Auth.Mfa.BackupCodesRemaining);

	// ============================================
	// Anonymous MFA verification endpoints (must NOT return 401)
	// ============================================

	/// <summary>
	/// Email MFA verify is pre-auth (no [Authorize]).
	/// </summary>
	[Fact]
	public async Task VerifyMfa_Anonymous_DoesNotReturnUnauthorizedAsync()
	{
		// Arrange
		HttpClient client =
			CreateClient();

		// Act
		HttpResponseMessage response =
			await client.PostAsJsonAsync(
				ApiEndpoints.Auth.Mfa.Verify,
				new { ChallengeToken = "invalid", Code = "000000" });

		// Assert — may return 400/429 but MUST NOT return 401
		response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
	}

	/// <summary>
	/// TOTP verify is pre-auth (no [Authorize]).
	/// </summary>
	[Fact]
	public async Task VerifyTotp_Anonymous_DoesNotReturnUnauthorizedAsync()
	{
		// Arrange
		HttpClient client =
			CreateClient();

		// Act
		HttpResponseMessage response =
			await client.PostAsJsonAsync(
				ApiEndpoints.Auth.Mfa.VerifyTotp,
				new { Email = "test@test.com", Code = "000000" });

		// Assert
		response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
	}

	/// <summary>
	/// Backup code verify is pre-auth (no [Authorize]).
	/// </summary>
	[Fact]
	public async Task VerifyBackupCode_Anonymous_DoesNotReturnUnauthorizedAsync()
	{
		// Arrange
		HttpClient client =
			CreateClient();

		// Act
		HttpResponseMessage response =
			await client.PostAsJsonAsync(
				ApiEndpoints.Auth.Mfa.VerifyBackup,
				new { Email = "test@test.com", Code = "ABCD-1234" });

		// Assert
		response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
	}

	/// <summary>
	/// MFA resend is pre-auth (no [Authorize]).
	/// </summary>
	[Fact]
	public async Task ResendMfa_Anonymous_DoesNotReturnUnauthorizedAsync()
	{
		// Arrange
		HttpClient client =
			CreateClient();

		// Act
		HttpResponseMessage response =
			await client.PostAsJsonAsync(
				ApiEndpoints.Auth.Mfa.Resend,
				new { ChallengeToken = "invalid" });

		// Assert
		response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
	}
}