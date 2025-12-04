// <copyright file="PermissionRequestServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Settings;
using Shouldly;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Unit tests for PermissionRequestService.
/// Focus: Business logic validation (80/20 - high value tests only).
/// </summary>
public class PermissionRequestServiceTests
{
	private readonly IPermissionRequestRepository Repository =
		Substitute.For<IPermissionRequestRepository>();

	private readonly IUserRepository UserRepository =
		Substitute.For<IUserRepository>();

	private readonly IOptions<WhitelistedPermissionSettings> WhitelistedOptions =
		Options.Create(new WhitelistedPermissionSettings());

	/// <summary>Initializes a new instance of the <see cref="PermissionRequestServiceTests"/> class.</summary>
	public PermissionRequestServiceTests()
	{
		// Set up role ID lookups (matches SecurityRoles seed data)
		Repository
			.GetRoleIdByNameAsync("Developer", Arg.Any<CancellationToken>())
			.Returns(1);
		Repository
			.GetRoleIdByNameAsync("Admin", Arg.Any<CancellationToken>())
			.Returns(2);
	}

	private PermissionRequestService Service => new(
		Repository,
		UserRepository,
		WhitelistedOptions);

	#region GetAvailableRolesAsync

	[Fact]
	public async Task GetAvailableRolesAsync_ReturnsAllRoles_WhenNoExistingRolesOrRequestsAsync()
	{
		// Arrange
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await Service.GetAvailableRolesAsync(1);

		// Assert
		List<AvailableRoleDto> roles = result.ToList();
		roles.Count.ShouldBe(2);
		roles.ShouldContain(role => role.Name == "Developer");
		roles.ShouldContain(role => role.Name == "Admin");
	}

	[Fact]
	public async Task GetAvailableRolesAsync_ExcludesRolesUserAlreadyHasAsync()
	{
		// Arrange - user already has Developer role
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns(["Developer"]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await Service.GetAvailableRolesAsync(1);

		// Assert - only Admin should be available
		List<AvailableRoleDto> roles = result.ToList();
		roles.Count.ShouldBe(1);
		roles[0].Name.ShouldBe("Admin");
	}

	[Fact]
	public async Task GetAvailableRolesAsync_ExcludesAlreadyRequestedRolesAsync()
	{
		// Arrange - user has pending request for Developer
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([new PermissionRequest { RequestedRoleId = 1, RequestedRole = new SecurityRole { Id = 1, Name = "Developer" } }]);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await Service.GetAvailableRolesAsync(1);

		// Assert
		List<AvailableRoleDto> roles = result.ToList();
		roles.Count.ShouldBe(1);
		roles[0].Name.ShouldBe("Admin");
	}

	#endregion

	#region CreateRequestsAsync

	[Fact]
	public async Task CreateRequestsAsync_ThrowsArgumentException_WhenNoRolesSelectedAsync()
	{
		// Arrange
		CreatePermissionRequestDto request =
			new([]);

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(
				() => Service.CreateRequestsAsync(
					1,
					"testuser",
					request));

		exception.Message.ShouldContain("At least one role");
	}

	[Fact]
	public async Task CreateRequestsAsync_ThrowsArgumentException_WhenInvalidRoleAsync()
	{
		// Arrange
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		CreatePermissionRequestDto request =
			new(["InvalidRole"]);

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(
				() => Service.CreateRequestsAsync(
					1,
					"testuser",
					request));

		exception.Message.ShouldContain("Invalid role");
	}

	[Fact]
	public async Task CreateRequestsAsync_CreatesOneRequestPerRoleAsync()
	{
		// Arrange
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		CreatePermissionRequestDto request =
			new(["Developer", "Admin"], "Need access");

		// Act
		await Service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - verify CreateAsync called twice
		await Repository
			.Received(2)
			.CreateAsync(
				Arg.Any<PermissionRequest>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateRequestsAsync_SkipsRolesUserAlreadyHas_IdempotentAsync()
	{
		// Arrange - user already has Developer role
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns(["Developer"]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		CreatePermissionRequestDto request =
			new(["Developer", "Admin"], "Need access");

		// Act
		await Service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - only Admin should be created (Developer skipped)
		// RoleId 2 = Admin (based on test setup)
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Is<PermissionRequest>(permissionRequest => permissionRequest.RequestedRoleId == 2),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateRequestsAsync_SkipsPendingRequests_IdempotentAsync()
	{
		// Arrange - user has pending request for Developer
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([new PermissionRequest { RequestedRoleId = 1, RequestedRole = new SecurityRole { Id = 1, Name = "Developer" } }]);

		CreatePermissionRequestDto request =
			new(["Developer", "Admin"], "Need access");

		// Act
		await Service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - only Admin should be created (Developer already requested)
		// RoleId 2 = Admin (based on test setup)
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Is<PermissionRequest>(permissionRequest => permissionRequest.RequestedRoleId == 2),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region CreateRequestsAsync - Whitelist Auto-Approval

	[Fact]
	public async Task CreateRequestsAsync_AutoApprovesWhitelistedRole_WithoutCreatingRequestAsync()
	{
		// Arrange - user is whitelisted for Developer role
		IOptions<WhitelistedPermissionSettings> whitelistedOptions =
			Options.Create(new WhitelistedPermissionSettings
			{
				Grants =
				[
					new WhitelistedGrant
					{
						Email = "developer@test.com",
						Roles = ["Developer"]
					}
				]
			});

		PermissionRequestService service =
			new(
				Repository,
				UserRepository,
				whitelistedOptions);

		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetUserEmailAsync(1, Arg.Any<CancellationToken>())
			.Returns("developer@test.com");

		CreatePermissionRequestDto request =
			new(["Developer"], "Need access");

		// Act
		await service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - role added directly via AddRoleWithoutAuditAsync, no request created
		await UserRepository
			.Received(1)
			.AddRoleWithoutAuditAsync(
				1,
				"Developer",
				Arg.Any<CancellationToken>());
		await Repository
			.DidNotReceive()
			.CreateAsync(
				Arg.Any<PermissionRequest>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateRequestsAsync_CreatesRequest_WhenNotWhitelistedAsync()
	{
		// Arrange - user is NOT whitelisted
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetUserEmailAsync(1, Arg.Any<CancellationToken>())
			.Returns("user@test.com");

		CreatePermissionRequestDto request =
			new(["Developer"], "Need access");

		// Act
		await Service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - request created, no direct role assignment
		// RoleId 1 = Developer (based on test setup)
		await UserRepository
			.DidNotReceive()
			.AddRoleWithoutAuditAsync(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Is<PermissionRequest>(permissionRequest => permissionRequest.RequestedRoleId == 1),
				Arg.Any<CancellationToken>());
	}

	#endregion
}