// <copyright file="TestUserHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Options for creating test users.
/// </summary>
/// <param name="PasswordHash">
/// Optional custom password hash. Defaults to <see cref="TestUserHelper.TestPasswordHash"/>.
/// </param>
/// <param name="IsActive">Whether the user should be active. Defaults to true.</param>
/// <param name="FullName">Optional full name for the user.</param>
public record CreateUserOptions(
	string? PasswordHash = null,
	bool IsActive = true,
	string? FullName = null);

/// <summary>
/// Helper methods for creating test users with pre-computed password hashes.
/// Eliminates runtime Argon2id computation overhead in tests.
/// </summary>
public static class TestUserHelper
{
	/// <summary>
	/// Lazily-initialized password hasher for generating test hashes.
	/// </summary>
	private static readonly Lazy<TestPasswordHasher> PasswordHasher =
		new(() =>
			new TestPasswordHasher());

	/// <summary>
	/// The standard test password used across API integration tests.
	/// </summary>
	public const string TestPassword = "TestPassword123!";

	/// <summary>
	/// Lazily-initialized Argon2id hash for <see cref="TestPassword"/>.
	/// Generated once per test run to ensure correctness.
	/// </summary>
	/// <remarks>
	/// Parameters: m=4096 (4MB), t=2, p=1 (optimized for fast tests).
	/// Production uses m=65536 (64MB), t=3, p=4.
	/// </remarks>
	private static readonly Lazy<string> LazyTestPasswordHash =
		new(() =>
			PasswordHasher.Value.HashPassword(TestPassword));

	/// <summary>
	/// Gets the Argon2id hash for <see cref="TestPassword"/>.
	/// </summary>
	public static string TestPasswordHash => LazyTestPasswordHash.Value;

	/// <summary>
	/// The standard test password used across unit tests.
	/// </summary>
	public const string SimplePassword = "Password123";

	/// <summary>
	/// Lazily-initialized Argon2id hash for <see cref="SimplePassword"/>.
	/// Generated once per test run to ensure correctness.
	/// </summary>
	private static readonly Lazy<string> LazySimplePasswordHash =
		new(() =>
			PasswordHasher.Value.HashPassword(SimplePassword));

	/// <summary>
	/// Gets the Argon2id hash for <see cref="SimplePassword"/>.
	/// </summary>
	public static string SimplePasswordHash => LazySimplePasswordHash.Value;

	/// <summary>
	/// Creates a test user with credentials using the pre-computed password hash.
	/// </summary>
	/// <param name="services">The service provider to resolve the DbContext.</param>
	/// <param name="username">The username for the new user.</param>
	/// <param name="email">The email for the new user.</param>
	/// <param name="timeProvider">The time provider for setting CreateDate.</param>
	/// <param name="options">Optional configuration for the user.</param>
	/// <returns>The created user.</returns>
	public static async Task<User> CreateUserWithPasswordAsync(
		IServiceProvider services,
		string username,
		string email,
		TimeProvider timeProvider,
		CreateUserOptions? options = null)
	{
		using IServiceScope scope = services.CreateScope();

		IdentityDbContext context =
			scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

		return await CreateUserWithPasswordAsync(
			context,
			username,
			email,
			timeProvider,
			options);
	}

	/// <summary>
	/// Creates a test user with credentials using the pre-computed password hash.
	/// </summary>
	/// <param name="context">The identity database context.</param>
	/// <param name="username">The username for the new user.</param>
	/// <param name="email">The email for the new user.</param>
	/// <param name="timeProvider">The time provider for setting CreateDate.</param>
	/// <param name="options">Optional configuration for the user.</param>
	/// <returns>The created user.</returns>
	public static async Task<User> CreateUserWithPasswordAsync(
		IdentityDbContext context,
		string username,
		string email,
		TimeProvider timeProvider,
		CreateUserOptions? options = null)
	{
		CreateUserOptions opts =
			options ?? new CreateUserOptions();

		User user =
			new()
			{
				Username = username,
				Email = email,
				FullName = opts.FullName,
				IsActive = opts.IsActive,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				CreatedBy = "Test",
				ModifiedBy = "Test",
			};

		context.Users.Add(user);
		await context.SaveChangesAsync();

		UserCredential credential =
			new()
			{
				UserId = user.Id,
				PasswordHash =
					opts.PasswordHash ?? TestPasswordHash,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
			};

		context.UserCredentials.Add(credential);
		await context.SaveChangesAsync();

		return user;
	}

	/// <summary>
	/// Creates a test user with credentials and optional roles.
	/// </summary>
	/// <param name="services">The service provider to resolve the DbContext.</param>
	/// <param name="username">The username for the new user.</param>
	/// <param name="email">The email for the new user.</param>
	/// <param name="roles">The roles to assign to the user.</param>
	/// <param name="timeProvider">The time provider for setting CreateDate.</param>
	/// <param name="options">Optional configuration for the user.</param>
	/// <returns>The created user.</returns>
	public static async Task<User> CreateUserWithRolesAsync(
		IServiceProvider services,
		string username,
		string email,
		IEnumerable<string> roles,
		TimeProvider timeProvider,
		CreateUserOptions? options = null)
	{
		using IServiceScope scope = services.CreateScope();

		IdentityDbContext context =
			scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

		User user =
			await CreateUserWithPasswordAsync(
			context,
			username,
			email,
			timeProvider,
			options);

		foreach (string role in roles)
		{
			int? roleId =
				await context
				.SecurityRoles.Where(securityRole => securityRole.Name == role)
				.Select(securityRole => (int?)securityRole.Id)
				.FirstOrDefaultAsync();

			if (roleId is null)
			{
				throw new InvalidOperationException(
					$"Role '{role}' not found in SecurityRoles");
			}

			context.UserRoles.Add(
				new UserRole
				{
					UserId = user.Id,
					RoleId = roleId.Value,
					CreateDate =
						timeProvider.GetUtcNow().UtcDateTime,
					CreatedBy = "test",
				});
		}

		await context.SaveChangesAsync();
		return user;
	}
}