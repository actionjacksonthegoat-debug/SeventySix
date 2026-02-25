// <copyright file="CreatePermissionRequestCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity.Commands.CreatePermissionRequest;
using SeventySix.Identity.Constants;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.CreatePermissionRequest;

/// <summary>
/// Unit tests for <see cref="CreatePermissionRequestCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on permission flow and auto-approval.
/// Security-critical: Role assignment must be thoroughly tested.
/// </remarks>
public sealed class CreatePermissionRequestCommandHandlerTests
{
	private readonly IPermissionRequestRepository Repository;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IIdentityCacheService IdentityCache;
	private readonly IOptions<WhitelistedPermissionSettings> WhitelistedOptions;

	/// <summary>
	/// Initializes a new instance of the <see cref="CreatePermissionRequestCommandHandlerTests"/> class.
	/// </summary>
	public CreatePermissionRequestCommandHandlerTests()
	{
		Repository =
			Substitute.For<IPermissionRequestRepository>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		IdentityCache =
			Substitute.For<IIdentityCacheService>();
		WhitelistedOptions =
			Options.Create(new WhitelistedPermissionSettings());
	}

	/// <summary>
	/// Tests that null command throws ArgumentNullException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NullCommand_ThrowsArgumentNullExceptionAsync()
	{
		// Act & Assert
		await Should.ThrowAsync<ArgumentNullException>(
			async () => await CreatePermissionRequestCommandHandler.HandleAsync(
				null!,
				Repository,
				UserManager,
				IdentityCache,
				WhitelistedOptions,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that empty roles throws ArgumentException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptyRoles_ThrowsArgumentExceptionAsync()
	{
		// Arrange
		CreatePermissionRequestDto dto =
			new([]);

		CreatePermissionRequestCommand command =
			new(UserId: 1, Username: "testuser", Request: dto);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			async () => await CreatePermissionRequestCommandHandler.HandleAsync(
				command,
				Repository,
				UserManager,
				IdentityCache,
				WhitelistedOptions,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that user not found throws UserNotFoundException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ThrowsUserNotFoundExceptionAsync()
	{
		// Arrange
		CreatePermissionRequestDto dto =
			new([RoleConstants.Developer]);

		CreatePermissionRequestCommand command =
			new(UserId: 999, Username: "testuser", Request: dto);

		UserManager
			.FindByIdAsync("999")
			.Returns(default(ApplicationUser?));

		// Act & Assert
		await Should.ThrowAsync<UserNotFoundException>(
			async () => await CreatePermissionRequestCommandHandler.HandleAsync(
				command,
				Repository,
				UserManager,
				IdentityCache,
				WhitelistedOptions,
				CancellationToken.None));
	}

	/// <summary>
	/// Tests that invalid role throws ArgumentException.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InvalidRole_ThrowsArgumentExceptionAsync()
	{
		// Arrange
		const long UserId = 1;

		ApplicationUser user =
			CreateUser(UserId);

		CreatePermissionRequestDto dto =
			new(["InvalidRole"]);

		CreatePermissionRequestCommand command =
			new(UserId, Username: "testuser", Request: dto);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([]);

		Repository
			.GetByUserIdAsync(
				UserId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(
				async () => await CreatePermissionRequestCommandHandler.HandleAsync(
					command,
					Repository,
					UserManager,
					IdentityCache,
					WhitelistedOptions,
					CancellationToken.None));

		exception.Message.ShouldContain("InvalidRole");
	}

	/// <summary>
	/// Tests that user already having role skips request (idempotent).
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserAlreadyHasRole_SkipsRequestAsync()
	{
		// Arrange
		const long UserId = 1;

		ApplicationUser user =
			CreateUser(UserId);

		CreatePermissionRequestDto dto =
			new([RoleConstants.Developer]);

		CreatePermissionRequestCommand command =
			new(UserId, Username: "testuser", Request: dto);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([RoleConstants.Developer]); // Already has the role

		Repository
			.GetByUserIdAsync(
				UserId,
				Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		await CreatePermissionRequestCommandHandler.HandleAsync(
			command,
			Repository,
			UserManager,
			IdentityCache,
			WhitelistedOptions,
			CancellationToken.None);

		// Assert - No request created
		await Repository
			.DidNotReceive()
			.CreateAsync(
				Arg.Any<PermissionRequest>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that pending request for same role is skipped (idempotent).
	/// </summary>
	[Fact]
	public async Task HandleAsync_PendingRequestExists_SkipsRequestAsync()
	{
		// Arrange
		const long UserId = 1;

		ApplicationUser user =
			CreateUser(UserId);

		ApplicationRole developerRole =
			new() { Id = 100, Name = RoleConstants.Developer };

		PermissionRequest existingPending =
			new()
			{
				UserId = UserId,
				RequestedRole = developerRole,
			};

		CreatePermissionRequestDto dto =
			new([RoleConstants.Developer]);

		CreatePermissionRequestCommand command =
			new(UserId, Username: "testuser", Request: dto);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.GetRolesAsync(user)
			.Returns([]);

		Repository
			.GetByUserIdAsync(
				UserId,
				Arg.Any<CancellationToken>())
			.Returns([existingPending]);

		// Act
		await CreatePermissionRequestCommandHandler.HandleAsync(
			command,
			Repository,
			UserManager,
			IdentityCache,
			WhitelistedOptions,
			CancellationToken.None);

		// Assert - No new request created
		await Repository
			.DidNotReceive()
			.CreateAsync(
				Arg.Any<PermissionRequest>(),
				Arg.Any<CancellationToken>());
	}

	private static ApplicationUser CreateUser(long userId)
	{
		FakeTimeProvider timeProvider =
			new(TestTimeProviderBuilder.DefaultTime);

		return new UserBuilder(timeProvider)
			.WithId(userId)
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.WithIsActive(true)
			.Build();
	}
}