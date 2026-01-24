// <copyright file="HealthControllerAuthorizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Authorization tests for HealthController.
/// Verifies that the scheduled-jobs endpoint requires Developer or Admin role.
/// </summary>
/// <remarks>
/// The base /health endpoint remains public for container health checks.
/// The /health/scheduled-jobs endpoint is protected to prevent information disclosure.
/// </remarks>
[Collection(CollectionNames.IdentityHealthPostgreSql)]
public class HealthControllerAuthorizationTests(
	IdentityHealthApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
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

	#region GET /health (Public)

	/// <summary>
	/// Tests that GET /health is accessible without authentication.
	/// </summary>
	/// <remarks>
	/// The base health endpoint remains public for container orchestrator health probes.
	/// </remarks>
	[Fact]
	public async Task GetHealthStatusAsync_WithoutAuth_ReturnsOkAsync()
	{
		// Arrange
		HttpClient client =
			CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Health.Base);

		// Assert - Health endpoint is public (200 or 503 for degraded)
		response.StatusCode.ShouldSatisfyAllConditions(
			() => response.StatusCode.ShouldBeOneOf(
				System.Net.HttpStatusCode.OK,
				System.Net.HttpStatusCode.ServiceUnavailable));
	}

	#endregion

	#region GET /health/scheduled-jobs (Developer or Admin)

	/// <summary>
	/// Tests that GET /health/scheduled-jobs returns 401 without authentication.
	/// </summary>
	[Fact]
	public Task GetScheduledJobsAsync_WithoutAuth_ReturnsUnauthorizedAsync() =>
		AuthHelper.AssertUnauthorizedAsync(
			HttpMethod.Get,
			ApiEndpoints.Health.ScheduledJobs);

	/// <summary>
	/// Tests that GET /health/scheduled-jobs returns 403 for User role.
	/// </summary>
	[Fact]
	public Task GetScheduledJobsAsync_WithUserRole_ReturnsForbiddenAsync() =>
		AuthHelper.AssertForbiddenForRoleAsync(
			TestRoleConstants.User,
			HttpMethod.Get,
			ApiEndpoints.Health.ScheduledJobs);

	/// <summary>
	/// Tests that GET /health/scheduled-jobs returns 200 for Developer role.
	/// </summary>
	[Fact]
	public Task GetScheduledJobsAsync_WithDeveloperRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.Developer,
			HttpMethod.Get,
			ApiEndpoints.Health.ScheduledJobs);

	/// <summary>
	/// Tests that GET /health/scheduled-jobs returns 200 for Admin role.
	/// </summary>
	[Fact]
	public Task GetScheduledJobsAsync_WithAdminRole_ReturnsOkAsync() =>
		AuthHelper.AssertAuthorizedForRoleAsync(
			TestRoleConstants.Admin,
			HttpMethod.Get,
			ApiEndpoints.Health.ScheduledJobs);

	#endregion
}