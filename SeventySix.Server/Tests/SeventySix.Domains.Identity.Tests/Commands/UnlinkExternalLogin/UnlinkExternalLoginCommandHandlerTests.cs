// <copyright file="UnlinkExternalLoginCommandHandlerTests.cs" company="SeventySix">
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

namespace SeventySix.Identity.Tests.Commands.UnlinkExternalLogin;

/// <summary>
/// Unit tests for <see cref="UnlinkExternalLoginCommandHandler"/>.
/// Validates unlinking OAuth providers and lockout prevention
/// (user must retain at least one authentication method).
/// </summary>
public sealed class UnlinkExternalLoginCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly FakeTimeProvider TimeProvider;
	private readonly ILogger<UnlinkExternalLoginCommand> Logger;
	private readonly ITransactionManager TransactionManager;

	private const string TestProvider = "GitHub";
	private const string TestProviderKey = "12345";
	private const string TestUsername = "testuser";
	private const string TestEmail = "test@example.com";
	private const string SecondProvider = "Google";
	private const string SecondProviderKey = "67890";

	/// <summary>
	/// Initializes a new instance of the <see cref="UnlinkExternalLoginCommandHandlerTests"/> class.
	/// </summary>
	public UnlinkExternalLoginCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
		Logger =
			Substitute.For<ILogger<UnlinkExternalLoginCommand>>();
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
	/// Verifies a valid unlink request removes the external login.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidRequest_RemovesLoginAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithIsActive(true)
				.Build();

		UserLoginInfo gitHubLogin =
			new(
				TestProvider,
				TestProviderKey,
				TestProvider);
		UserLoginInfo googleLogin =
			new(
				SecondProvider,
				SecondProviderKey,
				SecondProvider);

		SetupUserManager(
			user,
			[gitHubLogin, googleLogin],
			hasPassword: true);

		UnlinkExternalLoginCommand command =
			new(UserId: 42, Provider: TestProvider);

		// Act
		Shared.POCOs.Result result =
			await UnlinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		await UserManager
			.Received(1)
			.RemoveLoginAsync(
				user,
				TestProvider,
				TestProviderKey);
	}

	/// <summary>
	/// Verifies failure when user has no password and only one external login.
	/// Security: Cannot remove the last authentication method.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoPasswordAndLastLogin_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithIsActive(true)
				.Build();

		UserLoginInfo gitHubLogin =
			new(
				TestProvider,
				TestProviderKey,
				TestProvider);

		SetupUserManager(
			user,
			[gitHubLogin],
			hasPassword: false);

		UnlinkExternalLoginCommand command =
			new(UserId: 42, Provider: TestProvider);

		// Act
		Shared.POCOs.Result result =
			await UnlinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain(
			"Cannot disconnect",
			Case.Insensitive);
	}

	/// <summary>
	/// Verifies success when user has no password but multiple external logins.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoPasswordButMultipleLogins_RemovesLoginAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithIsActive(true)
				.Build();

		UserLoginInfo gitHubLogin =
			new(
				TestProvider,
				TestProviderKey,
				TestProvider);
		UserLoginInfo googleLogin =
			new(
				SecondProvider,
				SecondProviderKey,
				SecondProvider);

		SetupUserManager(
			user,
			[gitHubLogin, googleLogin],
			hasPassword: false);

		UnlinkExternalLoginCommand command =
			new(UserId: 42, Provider: TestProvider);

		// Act
		Shared.POCOs.Result result =
			await UnlinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		await UserManager
			.Received(1)
			.RemoveLoginAsync(
				user,
				TestProvider,
				TestProviderKey);
	}

	/// <summary>
	/// Verifies success when user has a password and only one external login.
	/// Password serves as fallback authentication method.
	/// </summary>
	[Fact]
	public async Task HandleAsync_HasPasswordAndLastLogin_RemovesLoginAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.WithIsActive(true)
				.Build();

		UserLoginInfo gitHubLogin =
			new(
				TestProvider,
				TestProviderKey,
				TestProvider);

		SetupUserManager(
			user,
			[gitHubLogin],
			hasPassword: true);

		UnlinkExternalLoginCommand command =
			new(UserId: 42, Provider: TestProvider);

		// Act
		Shared.POCOs.Result result =
			await UnlinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		await UserManager
			.Received(1)
			.RemoveLoginAsync(
				user,
				TestProvider,
				TestProviderKey);
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

		UnlinkExternalLoginCommand command =
			new(UserId: 999, Provider: TestProvider);

		// Act
		Shared.POCOs.Result result =
			await UnlinkExternalLoginCommandHandler.HandleAsync(
				command,
				UserManager,
				Logger,
				TransactionManager,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error!.ShouldContain("not found", Case.Insensitive);
	}

	/// <summary>
	/// Sets up UserManager mocks for the specified user, logins, and password state.
	/// </summary>
	/// <param name="user">
	/// The user to return from FindByIdAsync.
	/// </param>
	/// <param name="logins">
	/// The external logins to return from GetLoginsAsync.
	/// </param>
	/// <param name="hasPassword">
	/// Whether the user has a local password.
	/// </param>
	private void SetupUserManager(
		ApplicationUser user,
		IList<UserLoginInfo> logins,
		bool hasPassword)
	{
		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		UserManager
			.GetLoginsAsync(user)
			.Returns(logins);

		UserManager
			.HasPasswordAsync(user)
			.Returns(hasPassword);

		UserManager
			.RemoveLoginAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);
	}
}