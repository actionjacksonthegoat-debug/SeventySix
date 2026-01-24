// <copyright file="TestScenarios.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.TestUtilities.Builders;

namespace SeventySix.TestUtilities.Testing;

/// <summary>
/// Pre-built test scenarios for common test setups.
/// Reduces duplication and ensures consistency across tests.
/// </summary>
/// <remarks>
/// Use these scenario methods to:
/// - Create consistent test data across multiple test classes
/// - Reduce boilerplate in test setup
/// - Ensure seed data follows the same patterns
///
/// Each method handles both entity creation AND database persistence.
/// For read-only tests, combine with <see cref="SeededPostgreSqlFixture"/>
/// to seed data once and share across tests.
/// </remarks>
public static class TestScenarios
{
	/// <summary>
	/// Creates a standard user with confirmed email.
	/// </summary>
	/// <param name="context">
	/// The Identity database context.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for timestamps.
	/// </param>
	/// <param name="username">
	/// The username (defaults to "testuser").
	/// </param>
	/// <returns>
	/// The created and saved ApplicationUser.
	/// </returns>
	public static async Task<ApplicationUser> CreateConfirmedUserAsync(
		IdentityDbContext context,
		TimeProvider timeProvider,
		string username = "testuser")
	{
		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithUsername(username)
				.WithEmail($"{username}@test.com")
				.Build();

		user.EmailConfirmed = true;

		context.Users.Add(user);
		await context.SaveChangesAsync();

		return user;
	}

	/// <summary>
	/// Creates an unconfirmed user (pending email verification).
	/// </summary>
	/// <param name="context">
	/// The Identity database context.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for timestamps.
	/// </param>
	/// <param name="username">
	/// The username (defaults to "pendinguser").
	/// </param>
	/// <returns>
	/// The created and saved ApplicationUser.
	/// </returns>
	public static async Task<ApplicationUser> CreateUnconfirmedUserAsync(
		IdentityDbContext context,
		TimeProvider timeProvider,
		string username = "pendinguser")
	{
		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithUsername(username)
				.WithEmail($"{username}@test.com")
				.Build();

		user.EmailConfirmed = false;

		context.Users.Add(user);
		await context.SaveChangesAsync();

		return user;
	}

	/// <summary>
	/// Creates user with active session and valid refresh token.
	/// </summary>
	/// <param name="context">
	/// The Identity database context.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for timestamps.
	/// </param>
	/// <param name="username">
	/// The username (defaults to "sessionuser").
	/// </param>
	/// <returns>
	/// Tuple containing the user and their refresh token.
	/// </returns>
	public static async Task<(ApplicationUser User, RefreshToken Token)> CreateUserWithSessionAsync(
		IdentityDbContext context,
		TimeProvider timeProvider,
		string username = "sessionuser")
	{
		ApplicationUser user =
			await CreateConfirmedUserAsync(
				context,
				timeProvider,
				username);

		RefreshToken token =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(timeProvider.GetUtcNow().AddDays(7).UtcDateTime)
				.Build();

		context.RefreshTokens.Add(token);
		await context.SaveChangesAsync();

		return (user, token);
	}

	/// <summary>
	/// Creates a user with an expired refresh token.
	/// </summary>
	/// <param name="context">
	/// The Identity database context.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for timestamps.
	/// </param>
	/// <param name="username">
	/// The username (defaults to "expiredsessionuser").
	/// </param>
	/// <returns>
	/// Tuple containing the user and their expired refresh token.
	/// </returns>
	public static async Task<(ApplicationUser User, RefreshToken Token)> CreateUserWithExpiredSessionAsync(
		IdentityDbContext context,
		TimeProvider timeProvider,
		string username = "expiredsessionuser")
	{
		ApplicationUser user =
			await CreateConfirmedUserAsync(
				context,
				timeProvider,
				username);

		RefreshToken token =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(timeProvider.GetUtcNow().AddDays(-1).UtcDateTime)
				.Build();

		context.RefreshTokens.Add(token);
		await context.SaveChangesAsync();

		return (user, token);
	}

	/// <summary>
	/// Creates multiple users for testing pagination or batch operations.
	/// </summary>
	/// <param name="context">
	/// The Identity database context.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for timestamps.
	/// </param>
	/// <param name="count">
	/// Number of users to create.
	/// </param>
	/// <param name="usernamePrefix">
	/// Prefix for usernames (defaults to "batchuser").
	/// </param>
	/// <returns>
	/// List of created users.
	/// </returns>
	public static async Task<List<ApplicationUser>> CreateMultipleUsersAsync(
		IdentityDbContext context,
		TimeProvider timeProvider,
		int count,
		string usernamePrefix = "batchuser")
	{
		List<ApplicationUser> users = [];

		for (int index = 0; index < count; index++)
		{
			ApplicationUser user =
				new UserBuilder(timeProvider)
					.WithUsername($"{usernamePrefix}{index}")
					.WithEmail($"{usernamePrefix}{index}@test.com")
					.Build();

			user.EmailConfirmed = true;
			users.Add(user);
		}

		context.Users.AddRange(users);
		await context.SaveChangesAsync();

		return users;
	}

	/// <summary>
	/// Creates a log entry for testing.
	/// </summary>
	/// <param name="context">
	/// The Logging database context.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for timestamps.
	/// </param>
	/// <param name="message">
	/// Log message (defaults to "Test log message").
	/// </param>
	/// <returns>
	/// The created and saved Log.
	/// </returns>
	public static async Task<Log> CreateLogEntryAsync(
		LoggingDbContext context,
		TimeProvider timeProvider,
		string message = "Test log message")
	{
		Log log =
			new LogBuilder(timeProvider)
				.WithMessage(message)
				.Build();

		context.Logs.Add(log);
		await context.SaveChangesAsync();

		return log;
	}

	/// <summary>
	/// Creates multiple log entries for testing pagination or cleanup operations.
	/// </summary>
	/// <param name="context">
	/// The Logging database context.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for timestamps.
	/// </param>
	/// <param name="count">
	/// Number of logs to create.
	/// </param>
	/// <returns>
	/// List of created logs.
	/// </returns>
	public static async Task<List<Log>> CreateMultipleLogsAsync(
		LoggingDbContext context,
		TimeProvider timeProvider,
		int count)
	{
		List<Log> logs = [];

		for (int index = 0; index < count; index++)
		{
			Log log =
				new LogBuilder(timeProvider)
					.WithMessage($"Test log message {index}")
					.Build();

			logs.Add(log);
		}

		context.Logs.AddRange(logs);
		await context.SaveChangesAsync();

		return logs;
	}
}