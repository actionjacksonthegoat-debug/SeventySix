// <copyright file="UsersControllerMeEndpointTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for UsersController PUT /me endpoint (profile updates).
/// GET /me is handled by AuthController at /auth/me (see AuthControllerTests).
/// 80/20 Rule: Only critical happy paths tested.
/// </summary>
[Collection(CollectionNames.IdentityUsersPostgreSql)]
public class UsersControllerMeEndpointTests(
	IdentityUsersApiPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private HttpClient Client =
		null!;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		await base.InitializeAsync();
		await TruncateTablesAsync(TestTables.Identity);
		Client = CreateClient();
	}

	/// <inheritdoc/>
	public new Task DisposeAsync()
	{
		Client?.Dispose();
		return Task.CompletedTask;
	}

	/// <summary>
	/// Tests that PUT /api/v1/users/me updates profile and returns updated data.
	/// </summary>
	[Fact]
	public async Task UpdateCurrentUserAsync_ValidRequest_ReturnsUpdatedProfileAsync()
	{
		// Arrange - Create user and authenticate
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string username =
			$"testuser_{testId}";

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: username,
			email: $"original_{testId}@example.com",
			timeProvider);

		string accessToken =
			await AuthenticateUserAsync(
			username,
			TestUserHelper.TestPassword);

		Client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue("Bearer", accessToken);

		UpdateProfileRequest updateRequest =
			new(
			Email: $"updated_{testId}@example.com",
			FullName: "Updated Full Name");

		// Act
		HttpResponseMessage response =
			await Client.PutAsJsonAsync(
			ApiEndpoints.Users.Me,
			updateRequest);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		UserProfileDto? profile =
			await response.Content.ReadFromJsonAsync<UserProfileDto>();

		Assert.NotNull(profile);
		Assert.Equal(
			$"updated_{testId}@example.com",
			profile.Email);
		Assert.Equal("Updated Full Name", profile.FullName);
		Assert.Equal(username, profile.Username); // Username unchanged
	}

	/// <summary>
	/// Tests that PUT /api/v1/users/me returns 400 for invalid email.
	/// </summary>
	[Fact]
	public async Task UpdateCurrentUserAsync_InvalidEmail_ReturnsBadRequestAsync()
	{
		// Arrange - Create user and authenticate
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string username =
			$"testuser_{testId}";

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: username,
			email: $"test_{testId}@example.com",
			timeProvider);

		string accessToken =
			await AuthenticateUserAsync(
			username,
			TestUserHelper.TestPassword);

		Client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue("Bearer", accessToken);

		UpdateProfileRequest updateRequest =
			new(
			Email: "not-a-valid-email",
			FullName: null);

		// Act
		HttpResponseMessage response =
			await Client.PutAsJsonAsync(
			ApiEndpoints.Users.Me,
			updateRequest);

		// Assert
		Assert.Equal(
			HttpStatusCode.BadRequest,
			response.StatusCode);
	}

	/// <summary>
	/// Authenticates a user and returns the access token.
	/// </summary>
	private async Task<string> AuthenticateUserAsync(
		string username,
		string password)
	{
		LoginRequest loginRequest =
			new(
			UsernameOrEmail: username,
			Password: password);

		HttpResponseMessage loginResponse =
			await Client.PostAsJsonAsync(
			ApiEndpoints.Auth.Login,
			loginRequest);

		loginResponse.EnsureSuccessStatusCode();

		AuthResponse? authResponse =
			await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

		return authResponse!.AccessToken;
	}
}