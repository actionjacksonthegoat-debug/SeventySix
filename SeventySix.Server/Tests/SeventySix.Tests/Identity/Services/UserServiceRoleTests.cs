// <copyright file="UserServiceRoleTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Unit tests for UserService role management methods.
/// Focus: Role add/remove with permission request cleanup (80/20 - high value tests only).
/// </summary>
public class UserServiceRoleTests
{
	private readonly IUserRepository UserRepository =
		Substitute.For<IUserRepository>();

	private readonly IPermissionRequestRepository PermissionRequestRepository =
		Substitute.For<IPermissionRequestRepository>();

	private readonly IValidator<CreateUserRequest> CreateValidator =
		Substitute.For<IValidator<CreateUserRequest>>();

	private readonly IValidator<UpdateUserRequest> UpdateValidator =
		Substitute.For<IValidator<UpdateUserRequest>>();

	private readonly IValidator<UpdateProfileRequest> UpdateProfileValidator =
		Substitute.For<IValidator<UpdateProfileRequest>>();

	private readonly IValidator<UserQueryRequest> QueryValidator =
		Substitute.For<IValidator<UserQueryRequest>>();

	private readonly ITransactionManager TransactionManager =
		Substitute.For<ITransactionManager>();

	private readonly IAuthService AuthService =
		Substitute.For<IAuthService>();

	private readonly ILogger<UserService> Logger =
		Substitute.For<ILogger<UserService>>();

	private UserService Service => new(
		UserRepository,
		PermissionRequestRepository,
		CreateValidator,
		UpdateValidator,
		UpdateProfileValidator,
		QueryValidator,
		TransactionManager,
		AuthService,
		Logger);

	#region GetUserRolesAsync

	[Fact]
	public async Task GetUserRolesAsync_ReturnsRoles_FromRepositoryAsync()
	{
		// Arrange
		List<string> expectedRoles =
			[TestRoleConstants.Developer, TestRoleConstants.Admin];

		UserRepository
			.GetUserRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns(expectedRoles);

		// Act
		IEnumerable<string> result =
			await Service.GetUserRolesAsync(1);

		// Assert
		result.ShouldBe(expectedRoles);
		await UserRepository
			.Received(1)
			.GetUserRolesAsync(
				1,
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region AddUserRoleAsync

	[Fact]
	public async Task AddUserRoleAsync_AddsRoleAndCleansUpRequest_WhenValidAsync()
	{
		// Arrange
		UserRepository
			.HasRoleAsync(1, TestRoleConstants.Developer, Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		bool result =
			await Service.AddUserRoleAsync(
				1,
				TestRoleConstants.Developer);

		// Assert
		result.ShouldBeTrue();
		await UserRepository
			.Received(1)
			.AddRoleAsync(
				1,
				TestRoleConstants.Developer,
				Arg.Any<CancellationToken>());
		await PermissionRequestRepository
			.Received(1)
			.DeleteByUserAndRoleAsync(
				1,
				TestRoleConstants.Developer,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task AddUserRoleAsync_ReturnsFalse_WhenUserAlreadyHasRoleAsync()
	{
		// Arrange
		UserRepository
			.HasRoleAsync(1, TestRoleConstants.Developer, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		bool result =
			await Service.AddUserRoleAsync(
				1,
				TestRoleConstants.Developer);

		// Assert
		result.ShouldBeFalse();
		await UserRepository
			.DidNotReceive()
			.AddRoleAsync(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
		await PermissionRequestRepository
			.DidNotReceive()
			.DeleteByUserAndRoleAsync(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	[Theory]
	[InlineData("InvalidRole")]
	[InlineData("SuperUser")]
	[InlineData("")]
	public async Task AddUserRoleAsync_ThrowsArgumentException_WhenRoleIsInvalidAsync(string invalidRole)
	{
		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(
				() => Service.AddUserRoleAsync(
					1,
					invalidRole));

		exception.ParamName.ShouldBe("role");
		exception.Message.ShouldContain($"Invalid role: {invalidRole}");
	}

	#endregion

	#region RemoveUserRoleAsync

	[Fact]
	public async Task RemoveUserRoleAsync_ReturnsTrue_WhenRoleRemovedAsync()
	{
		// Arrange
		UserRepository
			.RemoveRoleAsync(1, TestRoleConstants.Developer, Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		bool result =
			await Service.RemoveUserRoleAsync(
				1,
				TestRoleConstants.Developer);

		// Assert
		result.ShouldBeTrue();
		await UserRepository
			.Received(1)
			.RemoveRoleAsync(
				1,
				TestRoleConstants.Developer,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task RemoveUserRoleAsync_ReturnsFalse_WhenRoleNotFoundAsync()
	{
		// Arrange
		UserRepository
			.RemoveRoleAsync(1, TestRoleConstants.Developer, Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		bool result =
			await Service.RemoveUserRoleAsync(
				1,
				TestRoleConstants.Developer);

		// Assert
		result.ShouldBeFalse();
	}

	#endregion
}