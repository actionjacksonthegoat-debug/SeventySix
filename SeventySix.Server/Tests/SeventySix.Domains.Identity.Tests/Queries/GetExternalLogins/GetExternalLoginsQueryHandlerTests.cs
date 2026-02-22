// <copyright file="GetExternalLoginsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Queries.GetExternalLogins;

/// <summary>
/// Unit tests for <see cref="GetExternalLoginsQueryHandler"/>.
/// Validates retrieval of linked OAuth providers for a user.
/// </summary>
public sealed class GetExternalLoginsQueryHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly FakeTimeProvider TimeProvider;

	private const string TestProvider = "GitHub";
	private const string TestProviderKey = "12345";
	private const string SecondProvider = "Google";
	private const string SecondProviderKey = "67890";

	/// <summary>
	/// Initializes a new instance of the <see cref="GetExternalLoginsQueryHandlerTests"/> class.
	/// </summary>
	public GetExternalLoginsQueryHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
	}

	/// <summary>
	/// Verifies handler returns external logins for a user with linked providers.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithLogins_ReturnsLoginListAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.Build();

		UserManager
			.FindByIdAsync("42")
			.Returns(user);

		IList<UserLoginInfo> logins =
			[
				new(
					TestProvider,
					TestProviderKey,
					TestProvider),
				new(
					SecondProvider,
					SecondProviderKey,
					SecondProvider),
			];

		UserManager
			.GetLoginsAsync(user)
			.Returns(logins);

		GetExternalLoginsQuery query =
			new(UserId: 42);

		// Act
		IReadOnlyList<ExternalLoginDto> result =
			await GetExternalLoginsQueryHandler.HandleAsync(
				query,
				UserManager);

		// Assert
		result.Count.ShouldBe(2);
		result.ShouldContain(
			login => login.Provider == TestProvider);
		result.ShouldContain(
			login => login.Provider == SecondProvider);
	}

	/// <summary>
	/// Verifies handler returns empty list for a user with no linked providers.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserWithNoLogins_ReturnsEmptyListAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.Build();

		UserManager
			.FindByIdAsync("42")
			.Returns(user);

		UserManager
			.GetLoginsAsync(user)
			.Returns(new List<UserLoginInfo>());

		GetExternalLoginsQuery query =
			new(UserId: 42);

		// Act
		IReadOnlyList<ExternalLoginDto> result =
			await GetExternalLoginsQueryHandler.HandleAsync(
				query,
				UserManager);

		// Assert
		result.ShouldBeEmpty();
	}

	/// <summary>
	/// Verifies handler returns empty list when user is not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsEmptyListAsync()
	{
		// Arrange
		UserManager
			.FindByIdAsync(Arg.Any<string>())
			.Returns((ApplicationUser?)null);

		GetExternalLoginsQuery query =
			new(UserId: 999);

		// Act
		IReadOnlyList<ExternalLoginDto> result =
			await GetExternalLoginsQueryHandler.HandleAsync(
				query,
				UserManager);

		// Assert
		result.ShouldBeEmpty();
	}
}