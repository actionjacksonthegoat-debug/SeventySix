// <copyright file="RegistrationControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.Identity;
using SeventySix.Shared.Utilities;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Integration tests for RegistrationController.
/// </summary>
/// <remarks>
/// Tests HTTP API endpoints for self-registration operations.
/// Uses shared WebApplicationFactory for improved test performance.
/// </remarks>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public class RegistrationControllerTests(IdentityAuthApiPostgreSqlFixture fixture)
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

	#region Self-Registration Tests

	/// <summary>
	/// Tests that POST /auth/register/initiate returns 200 OK for valid email.
	/// Returns 200 regardless of whether email exists (prevents enumeration).
	/// </summary>
	[Fact]
	public async Task InitiateRegistrationAsync_ValidEmail_ReturnsOkAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		InitiateRegistrationRequest request =
			new(
			$"newuser_{testId}@example.com");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.RegisterInitiate,
			request);

		// Assert - Should return OK regardless
		response.StatusCode.ShouldBe(HttpStatusCode.OK);
	}

	/// <summary>
	/// Tests that POST /auth/register/initiate returns 200 OK even for existing email.
	/// Prevents email enumeration attacks.
	/// </summary>
	[Fact]
	public async Task InitiateRegistrationAsync_ExistingEmail_ReturnsOkAsync()
	{
		// Arrange - Create existing user
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"existing_{testId}",
			email: $"existing_{testId}@example.com",
			timeProvider);

		InitiateRegistrationRequest request =
			new(
			$"existing_{testId}@example.com");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.RegisterInitiate,
			request);

		// Assert - Should return OK to prevent enumeration
		response.StatusCode.ShouldBe(HttpStatusCode.OK);
	}

	/// <summary>
	/// Tests that POST /auth/register/complete returns 400 for invalid token.
	/// </summary>
	[Fact]
	public async Task CompleteRegistrationAsync_InvalidToken_ReturnsBadRequestAsync()
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "invalid-token",
				Username: "newuser",
				Password: "SecurePass123!");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.RegisterComplete,
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

		ProblemDetails? problemDetails =
			await response.Content.ReadFromJsonAsync<ProblemDetails>();

		problemDetails.ShouldNotBeNull();
		problemDetails.Title.ShouldBe("Registration Completion Failed");
	}

	/// <summary>
	/// Tests that POST /auth/register/complete creates user with valid token.
	/// </summary>
	/// <remarks>
	/// With ASP.NET Core Identity, we use the full flow:
	/// 1. InitiateRegistration creates temporary user with email confirmation token
	/// 2. CompleteRegistration confirms email and activates user
	/// For this test, we skip the email verification and create user directly.
	/// </remarks>
	[Fact]
	public async Task CompleteRegistrationAsync_ValidToken_ReturnsCreatedAsync()
	{
		// Arrange - Create user with email confirmation token using UserManager
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"newuser_{testId}@example.com";
		string username =
			$"newuser_{testId}";
		string token;

		using (IServiceScope scope =
			SharedFactory.Services.CreateScope())
		{
			UserManager<ApplicationUser> userManager =
				scope.ServiceProvider.GetRequiredService<
					UserManager<ApplicationUser>>();
			TimeProvider timeProvider =
				scope.ServiceProvider.GetRequiredService<TimeProvider>();
			DateTime now =
				timeProvider.GetUtcNow().UtcDateTime;

			// Create temporary unconfirmed user (like InitiateRegistration does)
			ApplicationUser tempUser =
				new()
				{
					UserName =
						$"temp_{testId}",
					Email = email,
					EmailConfirmed = false,
					IsActive = false,
					CreateDate = now,
					CreatedBy = "Registration",
				};

			IdentityResult createResult =
				await userManager.CreateAsync(
					tempUser);

			createResult.Succeeded.ShouldBeTrue();

			// Generate email confirmation token
			token =
				await userManager.GenerateEmailConfirmationTokenAsync(
					tempUser);
		}

		string combinedToken =
			RegistrationTokenService.Encode(email, token);

		CompleteRegistrationRequest request =
			new(
				Token: combinedToken,
				Username: username,
				Password: "SecurePass123!");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.RegisterComplete,
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		authResponse.ShouldNotBeNull();
		authResponse.AccessToken.ShouldNotBeNullOrEmpty();
	}

	#endregion
}