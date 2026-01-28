// <copyright file="PasswordControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Integration tests for PasswordController.
/// </summary>
/// <remarks>
/// Tests HTTP API endpoints for password management operations.
/// Uses shared WebApplicationFactory for improved test performance.
/// </remarks>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public class PasswordControllerTests(IdentityAuthApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture),
		IAsyncLifetime
{
	private HttpClient? Client;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// Clean up auth tables before each test
		await TruncateTablesAsync(TestTables.Identity);

		// Use shared factory with custom client options
		Client =
			CreateClient(
			new WebApplicationFactoryClientOptions
			{
				AllowAutoRedirect = false,
			});
	}

	/// <inheritdoc/>
	public new Task DisposeAsync()
	{
		// Only dispose client, not the shared factory (managed by fixture)
		Client?.Dispose();
		return Task.CompletedTask;
	}

	#region Change Password Tests

	/// <summary>
	/// Tests that POST /auth/password/change returns 401 without authentication.
	/// </summary>
	[Fact]
	public async Task ChangePasswordAsync_Unauthenticated_ReturnsUnauthorizedAsync()
	{
		// Arrange
		ChangePasswordRequest request =
			new(
			CurrentPassword: "old",
			NewPassword: "new");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.Password.Change,
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
	}

	/// <summary>
	/// Tests that POST /auth/password/change returns 400 when password is too weak.
	/// Validates password complexity requirements are enforced.
	/// </summary>
	[Fact]
	public async Task ChangePasswordAsync_ReturnsBadRequest_WhenWeakPasswordAsync()
	{
		// Arrange - Login to get authenticated
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"weakpassuser_{testId}",
			email: $"weakpass_{testId}@example.com",
			timeProvider);

		HttpResponseMessage loginResponse =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.Login,
			new LoginRequest(
				$"weakpassuser_{testId}",
				TestUserHelper.TestPassword));

		AuthResponse? authResponse =
			await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

		Client!.DefaultRequestHeaders.Authorization =
			new System.Net.Http.Headers.AuthenticationHeaderValue(
				"Bearer",
				authResponse!.AccessToken);

		// Act - Try to change to a weak password (no uppercase)
		ChangePasswordRequest request =
			new(
			CurrentPassword: TestUserHelper.TestPassword,
			NewPassword: "weak123!");

		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.Password.Change,
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

		string content =
			await response.Content.ReadAsStringAsync();

		// Verify validation error response contains password-related message
		content.ToLowerInvariant().ShouldContain("password");
	}

	#endregion
}