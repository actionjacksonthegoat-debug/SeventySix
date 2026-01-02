// <copyright file="TestUserHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Options for creating test users.
/// </summary>
/// <param name="Password">
/// Optional custom password. Defaults to <see cref="TestUserHelper.TestPassword"/>.
/// </param>
/// <param name="IsActive">
/// Whether the user should be active. Defaults to true.
/// </param>
/// <param name="FullName">
/// Optional full name for the user.
/// </param>
public record CreateUserOptions(
	string? Password = null,
	bool IsActive = true,
	string? FullName = null);

/// <summary>
/// Helper methods for creating test users using ASP.NET Core Identity.
/// </summary>
public static class TestUserHelper
{
	/// <summary>
	/// The standard test password used across API integration tests.
	/// </summary>
	public const string TestPassword = "TestPassword123!";

	/// <summary>
	/// The standard test password used across unit tests.
	/// </summary>
	public const string SimplePassword = "Password123";

	/// <summary>
	/// Creates a test user with credentials using Identity's UserManager.
	/// </summary>
	/// <param name="services">
	/// The service provider to resolve the UserManager.
	/// </param>
	/// <param name="username">
	/// The username for the new user.
	/// </param>
	/// <param name="email">
	/// The email for the new user.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for setting CreateDate.
	/// </param>
	/// <param name="options">
	/// Optional configuration for the user.
	/// </param>
	/// <returns>
	/// The created user.
	/// </returns>
	public static async Task<ApplicationUser> CreateUserWithPasswordAsync(
		IServiceProvider services,
		string username,
		string email,
		TimeProvider timeProvider,
		CreateUserOptions? options = null)
	{
		using IServiceScope scope =
			services.CreateScope();

		UserManager<ApplicationUser> userManager =
			scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

		CreateUserOptions opts =
			options ?? new CreateUserOptions();

		ApplicationUser user =
			new()
			{
				UserName = username,
				Email = email,
				FullName = opts.FullName,
				IsActive = opts.IsActive,
				EmailConfirmed = true,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				CreatedBy = "Test",
				ModifiedBy = "Test",
			};

		string password =
			opts.Password ?? TestPassword;

		IdentityResult result =
			await userManager.CreateAsync(
				user,
				password);

		if (!result.Succeeded)
		{
			string errors =
				string.Join(", ", result.Errors.Select(error => error.Description));

			throw new InvalidOperationException(
				$"Failed to create test user: {errors}");
		}

		return user;
	}

	/// <summary>
	/// Creates a test user with credentials and optional roles.
	/// </summary>
	/// <param name="services">
	/// The service provider to resolve the UserManager.
	/// </param>
	/// <param name="username">
	/// The username for the new user.
	/// </param>
	/// <param name="email">
	/// The email for the new user.
	/// </param>
	/// <param name="roles">
	/// The roles to assign to the user.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for setting CreateDate.
	/// </param>
	/// <param name="options">
	/// Optional configuration for the user.
	/// </param>
	/// <returns>
	/// The created user.
	/// </returns>
	public static async Task<ApplicationUser> CreateUserWithRolesAsync(
		IServiceProvider services,
		string username,
		string email,
		IEnumerable<string> roles,
		TimeProvider timeProvider,
		CreateUserOptions? options = null)
	{
		using IServiceScope scope =
			services.CreateScope();

		UserManager<ApplicationUser> userManager =
			scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

		CreateUserOptions opts =
			options ?? new CreateUserOptions();

		ApplicationUser user =
			new()
			{
				UserName = username,
				Email = email,
				FullName = opts.FullName,
				IsActive = opts.IsActive,
				EmailConfirmed = true,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				CreatedBy = "Test",
				ModifiedBy = "Test",
			};

		string password =
			opts.Password ?? TestPassword;

		IdentityResult createResult =
			await userManager.CreateAsync(
				user,
				password);

		if (!createResult.Succeeded)
		{
			string errors = createResult.ToErrorString();

			throw new InvalidOperationException(
				$"Failed to create test user: {errors}");
		}
		foreach (string role in roles)
		{
			IdentityResult roleResult =
				await userManager.AddToRoleAsync(
					user,
					role);

			if (!roleResult.Succeeded)
			{
				string errors = roleResult.ToErrorString();

				throw new InvalidOperationException(
					$"Failed to add role '{role}': {errors}");
			}
		}

		return user;
	}
}