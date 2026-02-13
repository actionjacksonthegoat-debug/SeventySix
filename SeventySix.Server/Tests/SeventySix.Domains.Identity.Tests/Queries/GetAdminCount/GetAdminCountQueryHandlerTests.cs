// <copyright file="GetAdminCountQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Queries.GetAdminCount;

/// <summary>
/// Unit tests for <see cref="GetAdminCountQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on count accuracy.
/// Critical for last-admin protection business rule.
/// </remarks>
public class GetAdminCountQueryHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetAdminCountQueryHandlerTests"/> class.
	/// </summary>
	public GetAdminCountQueryHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
	}

	/// <summary>
	/// Tests that zero is returned when no admins exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoAdmins_ReturnsZeroAsync()
	{
		// Arrange
		GetAdminCountQuery query =
			new();

		UserManager
			.GetUsersInRoleAsync(RoleConstants.Admin)
			.Returns(new List<ApplicationUser>());

		// Act
		int result =
			await GetAdminCountQueryHandler.HandleAsync(
				query,
				UserManager);

		// Assert
		result.ShouldBe(0);
	}

	/// <summary>
	/// Tests that correct count is returned when admins exist.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleAdmins_ReturnsCorrectCountAsync()
	{
		// Arrange
		GetAdminCountQuery query =
			new();

		List<ApplicationUser> admins =
			[
				new() { Id = 1, UserName = "admin1" },
				new() { Id = 2, UserName = "admin2" },
				new() { Id = 3, UserName = "admin3" },
			];

		UserManager
			.GetUsersInRoleAsync(RoleConstants.Admin)
			.Returns(admins);

		// Act
		int result =
			await GetAdminCountQueryHandler.HandleAsync(
				query,
				UserManager);

		// Assert
		result.ShouldBe(3);
	}

	/// <summary>
	/// Tests that single admin returns count of one.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SingleAdmin_ReturnsOneAsync()
	{
		// Arrange
		GetAdminCountQuery query =
			new();

		List<ApplicationUser> admins =
			[new() { Id = 1, UserName = "admin" }];

		UserManager
			.GetUsersInRoleAsync(RoleConstants.Admin)
			.Returns(admins);

		// Act
		int result =
			await GetAdminCountQueryHandler.HandleAsync(
				query,
				UserManager);

		// Assert
		result.ShouldBe(1);
	}

	/// <summary>
	/// Tests that correct role constant is used.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UsesAdminRoleConstantAsync()
	{
		// Arrange
		GetAdminCountQuery query =
			new();

		UserManager
			.GetUsersInRoleAsync(Arg.Any<string>())
			.Returns(new List<ApplicationUser>());

		// Act
		await GetAdminCountQueryHandler.HandleAsync(
			query,
			UserManager);

		// Assert
		await UserManager
			.Received(1)
			.GetUsersInRoleAsync(RoleConstants.Admin);
	}
}