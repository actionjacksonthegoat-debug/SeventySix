// <copyright file="RestoreUserCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.RestoreUser;

/// <summary>
/// Unit tests for <see cref="RestoreUserCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on happy path and critical validation paths.
/// Security-critical: Soft-delete restore must be thoroughly tested.
/// </remarks>
public sealed class RestoreUserCommandHandlerTests
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IIdentityCacheService IdentityCache;
	private readonly ITransactionManager TransactionManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="RestoreUserCommandHandlerTests"/> class.
	/// </summary>
	public RestoreUserCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		IdentityCache =
			Substitute.For<IIdentityCacheService>();
		TransactionManager =
			Substitute.For<ITransactionManager>();
		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task<Result>>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(
				call =>
				{
					Func<CancellationToken, Task<Result>> op =
						call.ArgAt<Func<CancellationToken, Task<Result>>>(0);
					return op(CancellationToken.None);
				});
	}

	/// <summary>
	/// Tests successful restoration of a soft-deleted user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DeletedUser_RestoresSuccessfullyAsync()
	{
		// Arrange
		const long UserId = 42;

		ApplicationUser user =
			CreateDeletedUser(UserId);

		RestoreUserCommand command =
			new(UserId);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		UserManager
			.UpdateAsync(user)
			.Returns(IdentityResult.Success);

		// Act
		Result result =
			await RestoreUserCommandHandler.HandleAsync(
				command,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		user.IsDeleted.ShouldBeFalse();
		user.DeletedAt.ShouldBeNull();
		user.DeletedBy.ShouldBeNull();
		user.IsActive.ShouldBeTrue();

		await UserManager
			.Received(1)
			.UpdateAsync(user);
	}

	/// <summary>
	/// Tests failure when user is not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		const long UserId = 999;

		RestoreUserCommand command =
			new(UserId);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns((ApplicationUser?)null);

		// Act
		Result result =
			await RestoreUserCommandHandler.HandleAsync(
				command,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found");

		await UserManager
			.DidNotReceive()
			.UpdateAsync(Arg.Any<ApplicationUser>());
	}

	/// <summary>
	/// Tests failure when user is not deleted.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotDeleted_ReturnsFailureAsync()
	{
		// Arrange
		const long UserId = 42;

		ApplicationUser user =
			CreateActiveUser(UserId);

		RestoreUserCommand command =
			new(UserId);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		// Act
		Result result =
			await RestoreUserCommandHandler.HandleAsync(
				command,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not deleted");

		await UserManager
			.DidNotReceive()
			.UpdateAsync(Arg.Any<ApplicationUser>());
	}

	/// <summary>
	/// Tests failure when UserManager update fails.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UpdateFails_ReturnsFailureAsync()
	{
		// Arrange
		const long UserId = 42;

		ApplicationUser user =
			CreateDeletedUser(UserId);

		RestoreUserCommand command =
			new(UserId);

		UserManager
			.FindByIdAsync(UserId.ToString())
			.Returns(user);

		IdentityError error =
			new() { Description = "Update failed" };

		UserManager
			.UpdateAsync(user)
			.Returns(IdentityResult.Failed(error));

		// Act
		Result result =
			await RestoreUserCommandHandler.HandleAsync(
				command,
				UserManager,
				IdentityCache,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("Update failed");
	}

	private static ApplicationUser CreateDeletedUser(long userId)
	{
		return new UserBuilder(TimeProvider)
			.WithId(userId)
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.WithDeletedInfo(
				true,
				TimeProvider.GetUtcNow().AddDays(-1).UtcDateTime,
				"admin")
			.WithIsActive(false)
			.Build();
	}

	private static ApplicationUser CreateActiveUser(long userId)
	{
		return new UserBuilder(TimeProvider)
			.WithId(userId)
			.WithUsername("activeuser")
			.WithEmail("active@example.com")
			.WithDeletedInfo(false)
			.WithIsActive(true)
			.Build();
	}
}