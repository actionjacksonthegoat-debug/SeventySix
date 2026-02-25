// <copyright file="LinkExternalLoginCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.LinkExternalLogin;

/// <summary>
/// Unit tests for <see cref="LinkExternalLoginCommandHandler"/>.
/// Validates linking OAuth providers, duplicate detection, inactive user check,
/// and Display Name sync behavior.
/// </summary>
public sealed class LinkExternalLoginCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly FakeTimeProvider TimeProvider;
	private readonly ILogger<LinkExternalLoginCommand> Logger;
	private readonly ITransactionManager TransactionManager;

	private const string TestProvider = "GitHub";
	private const string TestProviderKey = "12345";
	private const string TestUsername = "testuser";
	private const string TestEmail = "test@example.com";
	private const string TestDisplayName = "GitHub Display Name";

	/// <summary>
	/// Initializes a new instance of the <see cref="LinkExternalLoginCommandHandlerTests"/> class.
	/// </summary>
	public LinkExternalLoginCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
		Logger =
			Substitute.For<ILogger<LinkExternalLoginCommand>>();
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
					Func<CancellationToken, Task<Result>> operation =
						call.ArgAt<Func<CancellationToken, Task<Result>>>(0);
					return operation(CancellationToken.None);
				});
	}

	/// <summary>
	/// Verifies a valid link request adds the external login to the user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_AddsLoginToUserAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithIsActive(true)
				.Build();

		UserManager
			.FindByIdAsync("42")
			.Returns(user);

		UserManager
			.FindByLoginAsync(
				Arg.Any<string>(),
				Arg.Any<string>())
			.Returns(default(ApplicationUser?));

		UserManager
			.AddLoginAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<UserLoginInfo>())
			.Returns(IdentityResult.Success);

		LinkExternalLoginCommand command =
			new(
				UserId: 42,
				Provider: TestProvider,
				ProviderUserId: TestProviderKey,
				FullName: null);

		// Act
		Shared.POCOs.Result result =
			await LinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		await UserManager
			.Received(1)
			.AddLoginAsync(
				user,
				Arg.Is<UserLoginInfo>(login =>
					login.LoginProvider == TestProvider
					&& login.ProviderKey == TestProviderKey));
	}

	/// <summary>
	/// Verifies failure when user is not found.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		UserManager
			.FindByIdAsync(Arg.Any<string>())
			.Returns(default(ApplicationUser?));

		LinkExternalLoginCommand command =
			new(
				UserId: 999,
				Provider: TestProvider,
				ProviderUserId: TestProviderKey,
				FullName: null);

		// Act
		Shared.POCOs.Result result =
			await LinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found", Case.Insensitive);
	}

	/// <summary>
	/// Verifies failure when the external login is already linked to another user.
	/// </summary>
	[Fact]
	public async Task HandleAsync_LoginAlreadyLinkedToOtherUser_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithIsActive(true)
				.Build();

		ApplicationUser otherUser =
			new UserBuilder(TimeProvider)
				.WithId(99)
				.WithUsername("otheruser")
				.WithEmail("other@example.com")
				.WithIsActive(true)
				.Build();

		UserManager
			.FindByIdAsync("42")
			.Returns(user);

		UserManager
			.FindByLoginAsync(TestProvider, TestProviderKey)
			.Returns(otherUser);

		LinkExternalLoginCommand command =
			new(
				UserId: 42,
				Provider: TestProvider,
				ProviderUserId: TestProviderKey,
				FullName: null);

		// Act
		Shared.POCOs.Result result =
			await LinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("already linked", Case.Insensitive);
	}

	/// <summary>
	/// Verifies failure when the user account is inactive.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserInactive_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithIsActive(false)
				.Build();

		UserManager
			.FindByIdAsync("42")
			.Returns(user);

		LinkExternalLoginCommand command =
			new(
				UserId: 42,
				Provider: TestProvider,
				ProviderUserId: TestProviderKey,
				FullName: null);

		// Act
		Shared.POCOs.Result result =
			await LinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("inactive", Case.Insensitive);
	}

	/// <summary>
	/// Verifies Display Name is synced from provider when user's is empty.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserHasNoFullName_SetsFullNameFromProviderAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithFullName(null)
				.WithIsActive(true)
				.Build();

		UserManager
			.FindByIdAsync("42")
			.Returns(user);

		UserManager
			.FindByLoginAsync(
				Arg.Any<string>(),
				Arg.Any<string>())
			.Returns(default(ApplicationUser?));

		UserManager
			.AddLoginAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<UserLoginInfo>())
			.Returns(IdentityResult.Success);

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		LinkExternalLoginCommand command =
			new(
				UserId: 42,
				Provider: TestProvider,
				ProviderUserId: TestProviderKey,
				FullName: TestDisplayName);

		// Act
		Shared.POCOs.Result result =
			await LinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		user.FullName.ShouldBe(TestDisplayName);
		await UserManager
			.Received(1)
			.UpdateAsync(
				Arg.Is<ApplicationUser>(updated =>
					updated.FullName == TestDisplayName));
	}

	/// <summary>
	/// Verifies Display Name is NOT overwritten when user already has one.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UserHasExistingFullName_DoesNotOverwriteAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithFullName("Manual Name")
				.WithIsActive(true)
				.Build();

		UserManager
			.FindByIdAsync("42")
			.Returns(user);

		UserManager
			.FindByLoginAsync(
				Arg.Any<string>(),
				Arg.Any<string>())
			.Returns(default(ApplicationUser?));

		UserManager
			.AddLoginAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<UserLoginInfo>())
			.Returns(IdentityResult.Success);

		LinkExternalLoginCommand command =
			new(
				UserId: 42,
				Provider: TestProvider,
				ProviderUserId: TestProviderKey,
				FullName: TestDisplayName);

		// Act
		Shared.POCOs.Result result =
			await LinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				TimeProvider,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		user.FullName.ShouldBe("Manual Name");
		await UserManager
			.DidNotReceive()
			.UpdateAsync(Arg.Any<ApplicationUser>());
	}
}