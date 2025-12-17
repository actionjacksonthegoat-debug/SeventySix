// <copyright file="AuthorizationTestHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using Xunit;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Helper for testing controller authorization with minimal boilerplate.
/// Provides fluent API for testing 401 (unauthenticated), 403 (forbidden), and 200 (authorized).
/// </summary>
public class AuthorizationTestHelper
{
	private readonly HttpClient Client;
	private readonly IServiceProvider Services;
	private int UserCounter;

	/// <summary>
	/// Initializes a new instance of the <see cref="AuthorizationTestHelper"/> class.
	/// </summary>
	/// <param name="client">The HTTP client to use for requests.</param>
	/// <param name="services">The service provider to resolve dependencies.</param>
	public AuthorizationTestHelper(HttpClient client, IServiceProvider services)
	{
		Client = client;
		Services = services;
	}

	/// <summary>
	/// Asserts that the endpoint returns 401 Unauthorized without authentication.
	/// </summary>
	/// <param name="method">The HTTP method.</param>
	/// <param name="endpoint">The endpoint URL.</param>
	/// <param name="content">Optional request content for POST/PUT.</param>
	public async Task AssertUnauthorizedAsync(
		HttpMethod method,
		string endpoint,
		HttpContent? content = null)
	{
		// Ensure no auth header is set
		Client.DefaultRequestHeaders.Authorization = null;

		HttpResponseMessage response =
			await SendRequestAsync(
			method,
			endpoint,
			content);

		Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
	}

	/// <summary>
	/// Asserts that the endpoint returns 403 Forbidden for the specified role.
	/// </summary>
	/// <param name="role">The role that should be forbidden.</param>
	/// <param name="method">The HTTP method.</param>
	/// <param name="endpoint">The endpoint URL.</param>
	/// <param name="content">Optional request content for POST/PUT.</param>
	public async Task AssertForbiddenForRoleAsync(
		string role,
		HttpMethod method,
		string endpoint,
		HttpContent? content = null)
	{
		await AuthenticateAsRoleAsync(role);

		HttpResponseMessage response =
			await SendRequestAsync(
			method,
			endpoint,
			content);

		Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
	}

	/// <summary>
	/// Asserts that the endpoint returns a successful status code for the specified role.
	/// Accepts 200, 201, or 204 as success.
	/// </summary>
	/// <param name="role">The role that should have access.</param>
	/// <param name="method">The HTTP method.</param>
	/// <param name="endpoint">The endpoint URL.</param>
	/// <param name="content">Optional request content for POST/PUT.</param>
	public async Task AssertAuthorizedForRoleAsync(
		string role,
		HttpMethod method,
		string endpoint,
		HttpContent? content = null)
	{
		await AuthenticateAsRoleAsync(role);

		HttpResponseMessage response =
			await SendRequestAsync(
			method,
			endpoint,
			content);

		// Accept any 2xx status code as success (200, 201, 204, etc.)
		Assert.True(
			response.IsSuccessStatusCode,
			$"Expected success status code but got {response.StatusCode}");
	}

	/// <summary>
	/// Asserts that the endpoint returns the expected status code for the specified role.
	/// </summary>
	/// <param name="role">The role to authenticate as.</param>
	/// <param name="method">The HTTP method.</param>
	/// <param name="endpoint">The endpoint URL.</param>
	/// <param name="expectedStatusCode">The expected HTTP status code.</param>
	/// <param name="content">Optional request content for POST/PUT.</param>
	public async Task AssertStatusCodeForRoleAsync(
		string role,
		HttpMethod method,
		string endpoint,
		HttpStatusCode expectedStatusCode,
		HttpContent? content = null)
	{
		await AuthenticateAsRoleAsync(role);

		HttpResponseMessage response =
			await SendRequestAsync(
			method,
			endpoint,
			content);

		Assert.Equal(expectedStatusCode, response.StatusCode);
	}

	/// <summary>
	/// Creates a user with the specified role and authenticates the client.
	/// </summary>
	/// <param name="role">The role to assign to the user.</param>
	private async Task AuthenticateAsRoleAsync(string role)
	{
		string uniqueSuffix =
			$"{role.ToLowerInvariant()}_{++UserCounter}_{Guid.NewGuid():N}";

		string username =
			$"test_{uniqueSuffix}";

		string email =
			$"{uniqueSuffix}@test.com";

		await TestUserHelper.CreateUserWithRolesAsync(
			Services,
			username,
			email,
			[role],
			TimeProvider.System);

		string token =
			await LoginAndGetTokenAsync(username);

		Client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue("Bearer", token);
	}

	/// <summary>
	/// Logs in and returns the access token.
	/// </summary>
	/// <param name="username">The username to log in with.</param>
	/// <returns>The JWT access token.</returns>
	private async Task<string> LoginAndGetTokenAsync(string username)
	{
		LoginRequest request =
			new(
			UsernameOrEmail: username,
			Password: TestUserHelper.TestPassword);

		HttpResponseMessage response =
			await Client.PostAsJsonAsync(
			ApiEndpoints.Auth.Login,
			request);

		response.EnsureSuccessStatusCode();

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		return authResponse!.AccessToken;
	}

	/// <summary>
	/// Sends an HTTP request with the specified method and content.
	/// </summary>
	private async Task<HttpResponseMessage> SendRequestAsync(
		HttpMethod method,
		string endpoint,
		HttpContent? content)
	{
		HttpRequestMessage request =
			new(method, endpoint)
			{
				Content = content,
			};

		// Copy Authorization header - DefaultRequestHeaders are NOT auto-applied when using SendAsync with HttpRequestMessage
		if (Client.DefaultRequestHeaders.Authorization != null)
		{
			request.Headers.Authorization =
				Client
				.DefaultRequestHeaders
				.Authorization;
		}

		return await Client.SendAsync(request);
	}
}