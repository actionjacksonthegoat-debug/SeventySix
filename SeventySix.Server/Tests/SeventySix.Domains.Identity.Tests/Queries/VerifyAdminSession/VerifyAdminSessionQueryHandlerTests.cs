// <copyright file="VerifyAdminSessionQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Queries.VerifyAdminSession;

/// <summary>
/// Unit tests for <see cref="VerifyAdminSessionQueryHandler"/>.
/// Tests the refresh-token-based admin session verification used by nginx auth_request.
/// </summary>
public sealed class VerifyAdminSessionQueryHandlerTests
{
	private const string ValidRefreshToken = "valid-refresh-token";
	private const long AdminUserId = 1L;
	private const long RegularUserId = 2L;

	/// <summary>
	/// Tests that a valid refresh token for an active admin user returns true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidAdminToken_ReturnsTrueAsync()
	{
		// Arrange
		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		ApplicationUser adminUser =
			new()
			{
				Id = AdminUserId,
				UserName = "admin",
				Email = "admin@example.com",
				IsActive = true
			};

		tokenService
			.ValidateRefreshTokenAsync(
				ValidRefreshToken,
				Arg.Any<CancellationToken>())
			.Returns(AdminUserId);

		userManager
			.FindByIdAsync(AdminUserId.ToString(
				System.Globalization.CultureInfo.InvariantCulture))
			.Returns(adminUser);

		userManager
			.IsInRoleAsync(adminUser, RoleConstants.Admin)
			.Returns(true);

		VerifyAdminSessionQuery query =
			new(ValidRefreshToken);

		// Act
		bool result =
			await VerifyAdminSessionQueryHandler.HandleAsync(
				query,
				tokenService,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that an invalid refresh token returns false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InvalidToken_ReturnsFalseAsync()
	{
		// Arrange
		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		tokenService
			.ValidateRefreshTokenAsync(
				"invalid-token",
				Arg.Any<CancellationToken>())
			.Returns(default(long?));

		VerifyAdminSessionQuery query =
			new("invalid-token");

		// Act
		bool result =
			await VerifyAdminSessionQueryHandler.HandleAsync(
				query,
				tokenService,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that a valid token for a non-admin user returns false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NonAdminUser_ReturnsFalseAsync()
	{
		// Arrange
		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		ApplicationUser regularUser =
			new()
			{
				Id = RegularUserId,
				UserName = "user",
				Email = "user@example.com",
				IsActive = true
			};

		tokenService
			.ValidateRefreshTokenAsync(
				ValidRefreshToken,
				Arg.Any<CancellationToken>())
			.Returns(RegularUserId);

		userManager
			.FindByIdAsync(RegularUserId.ToString(
				System.Globalization.CultureInfo.InvariantCulture))
			.Returns(regularUser);

		userManager
			.IsInRoleAsync(regularUser, RoleConstants.Admin)
			.Returns(false);

		VerifyAdminSessionQuery query =
			new(ValidRefreshToken);

		// Act
		bool result =
			await VerifyAdminSessionQueryHandler.HandleAsync(
				query,
				tokenService,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that a valid token for an inactive admin returns false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InactiveAdmin_ReturnsFalseAsync()
	{
		// Arrange
		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		ApplicationUser inactiveAdmin =
			new()
			{
				Id = AdminUserId,
				UserName = "admin",
				Email = "admin@example.com",
				IsActive = false
			};

		tokenService
			.ValidateRefreshTokenAsync(
				ValidRefreshToken,
				Arg.Any<CancellationToken>())
			.Returns(AdminUserId);

		userManager
			.FindByIdAsync(AdminUserId.ToString(
				System.Globalization.CultureInfo.InvariantCulture))
			.Returns(inactiveAdmin);

		VerifyAdminSessionQuery query =
			new(ValidRefreshToken);

		// Act
		bool result =
			await VerifyAdminSessionQueryHandler.HandleAsync(
				query,
				tokenService,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that a valid token for a non-existent user returns false.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFalseAsync()
	{
		// Arrange
		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		tokenService
			.ValidateRefreshTokenAsync(
				ValidRefreshToken,
				Arg.Any<CancellationToken>())
			.Returns(AdminUserId);

		userManager
			.FindByIdAsync(AdminUserId.ToString(
				System.Globalization.CultureInfo.InvariantCulture))
			.Returns(default(ApplicationUser));

		VerifyAdminSessionQuery query =
			new(ValidRefreshToken);

		// Act
		bool result =
			await VerifyAdminSessionQueryHandler.HandleAsync(
				query,
				tokenService,
				userManager,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}
}