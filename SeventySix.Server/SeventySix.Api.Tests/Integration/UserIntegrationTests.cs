// <copyright file="UserIntegrationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SeventySix.Api.Tests.Attributes;
using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Api.Tests.Integration;

/// <summary>
/// Integration tests for User API endpoints.
/// Tests the full stack from HTTP request to response.
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Test real HTTP endpoints
/// - Test full request/response cycle
/// - Test with actual dependencies (or test doubles)
/// - Verify JSON serialization
///
/// Uses WebApplicationFactory for in-memory test server.
///
/// Coverage Focus:
/// - GET /api/user - Get all users
/// - GET /api/user/{id} - Get user by ID
/// - POST /api/user - Create user
/// - HTTP status codes
/// - Request/response JSON
/// - Validation errors
/// </remarks>
public class UserIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
	private readonly WebApplicationFactory<Program> Factory;
	private readonly HttpClient Client;

	public UserIntegrationTests(WebApplicationFactory<Program> factory)
	{
		Factory = factory;
		Client = factory.CreateClient();
	}

	#region GET /api/user Tests

	[IntegrationTest]
	public async Task GetAllUsers_ShouldReturnOkWithUsersAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync("/api/user");

		// Assert
		response.EnsureSuccessStatusCode();
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		List<UserDto>? users = await response.Content.ReadFromJsonAsync<List<UserDto>>();
		Assert.NotNull(users);
		Assert.NotEmpty(users); // Seeded data should exist
	}

	[IntegrationTest]
	public async Task GetAllUsers_ShouldReturnJsonContentTypeAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync("/api/user");

		// Assert
		Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
	}

	#endregion

	#region GET /api/user/{id} Tests

	[IntegrationTest]
	public async Task GetUserById_ShouldReturnOkWithUser_WhenUserExistsAsync()
	{
		// Arrange - assuming seeded user with ID 1 exists
		int userId = 1;

		// Act
		HttpResponseMessage response = await Client.GetAsync($"/api/user/{userId}");

		// Assert
		response.EnsureSuccessStatusCode();
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		UserDto? user = await response.Content.ReadFromJsonAsync<UserDto>();
		Assert.NotNull(user);
		Assert.Equal(userId, user.Id);
		Assert.NotNull(user.Username);
		Assert.NotNull(user.Email);
	}

	[IntegrationTest]
	public async Task GetUserById_ShouldReturnNotFound_WhenUserDoesNotExistAsync()
	{
		// Arrange
		int nonExistentId = 99999;

		// Act
		HttpResponseMessage response = await Client.GetAsync($"/api/user/{nonExistentId}");

		// Assert
		Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
	}

	#endregion

	#region POST /api/user Tests

	[IntegrationTest]
	public async Task CreateUser_ShouldReturnCreated_WhenRequestIsValidAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "integration_test_user",
			Email = "integration@test.com",
			FullName = "Integration Test User",
			IsActive = true,
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.Created, response.StatusCode);
		Assert.NotNull(response.Headers.Location); // Location header should be set

		UserDto? createdUser = await response.Content.ReadFromJsonAsync<UserDto>();
		Assert.NotNull(createdUser);
		Assert.True(createdUser.Id > 0); // ID should be assigned
		Assert.Equal("integration_test_user", createdUser.Username);
		Assert.Equal("integration@test.com", createdUser.Email);
		Assert.Equal("Integration Test User", createdUser.FullName);
		Assert.True(createdUser.IsActive);
	}

	[IntegrationTest]
	public async Task CreateUser_ShouldReturnBadRequest_WhenUsernameIsTooShortAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "ab", // Too short (< 3 chars)
			Email = "test@example.com",
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	[IntegrationTest]
	public async Task CreateUser_ShouldReturnBadRequest_WhenUsernameContainsInvalidCharactersAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "user name", // Contains space
			Email = "test@example.com",
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	[IntegrationTest]
	public async Task CreateUser_ShouldReturnBadRequest_WhenEmailIsInvalidAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "not-an-email", // Invalid email format
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	[IntegrationTest]
	public async Task CreateUser_ShouldReturnBadRequest_WhenUsernameIsEmptyAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = string.Empty,
			Email = "test@example.com",
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	[IntegrationTest]
	public async Task CreateUser_ShouldReturnBadRequest_WhenEmailIsEmptyAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = string.Empty,
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	[IntegrationTest]
	public async Task CreateUser_ShouldAcceptNullFullNameAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "user_without_fullname",
			Email = "nofullname@test.com",
			FullName = null,
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.Created, response.StatusCode);

		UserDto? createdUser = await response.Content.ReadFromJsonAsync<UserDto>();
		Assert.NotNull(createdUser);
		Assert.Null(createdUser.FullName);
	}

	[IntegrationTest]
	public async Task CreateUser_ShouldAcceptIsActiveFalseAsync()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "inactive_user",
			Email = "inactive@test.com",
			IsActive = false,
		};

		// Act
		HttpResponseMessage response = await Client.PostAsJsonAsync("/api/user", request);

		// Assert
		Assert.Equal(HttpStatusCode.Created, response.StatusCode);

		UserDto? createdUser = await response.Content.ReadFromJsonAsync<UserDto>();
		Assert.NotNull(createdUser);
		Assert.False(createdUser.IsActive);
	}

	#endregion

	#region End-to-End Flow Tests

	[IntegrationTest]
	public async Task EndToEnd_CreateThenRetrieveUserAsync()
	{
		// Arrange
		CreateUserRequest createRequest = new()
		{
			Username = "e2e_test_user",
			Email = "e2e@test.com",
			FullName = "End to End Test",
			IsActive = true,
		};

		// Act 1: Create user
		HttpResponseMessage createResponse = await Client.PostAsJsonAsync("/api/user", createRequest);
		Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

		UserDto? createdUser = await createResponse.Content.ReadFromJsonAsync<UserDto>();
		Assert.NotNull(createdUser);
		int userId = createdUser.Id;

		// Act 2: Retrieve the created user
		HttpResponseMessage getResponse = await Client.GetAsync($"/api/user/{userId}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

		UserDto? retrievedUser = await getResponse.Content.ReadFromJsonAsync<UserDto>();
		Assert.NotNull(retrievedUser);
		Assert.Equal(userId, retrievedUser.Id);
		Assert.Equal("e2e_test_user", retrievedUser.Username);
		Assert.Equal("e2e@test.com", retrievedUser.Email);
		Assert.Equal("End to End Test", retrievedUser.FullName);
		Assert.True(retrievedUser.IsActive);
	}

	[IntegrationTest]
	public async Task EndToEnd_CreateUserAndVerifyInGetAllAsync()
	{
		// Arrange
		CreateUserRequest createRequest = new()
		{
			Username = "getall_test_user",
			Email = "getall@test.com",
		};

		// Act 1: Create user
		HttpResponseMessage createResponse = await Client.PostAsJsonAsync("/api/user", createRequest);
		Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

		UserDto? createdUser = await createResponse.Content.ReadFromJsonAsync<UserDto>();
		Assert.NotNull(createdUser);

		// Act 2: Get all users
		HttpResponseMessage getAllResponse = await Client.GetAsync("/api/user");
		Assert.Equal(HttpStatusCode.OK, getAllResponse.StatusCode);

		List<UserDto>? allUsers = await getAllResponse.Content.ReadFromJsonAsync<List<UserDto>>();

		// Assert
		Assert.NotNull(allUsers);
		Assert.Contains(allUsers, u => u.Id == createdUser.Id && u.Username == "getall_test_user");
	}

	#endregion
}