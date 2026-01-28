// <copyright file="SetPasswordCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.SetPassword;

/// <summary>
/// Tests for <see cref="SetPasswordCommandHandler"/>.
/// </summary>
/// <remarks>
/// Focuses on token validation and password reset flow.
/// Uses ASP.NET Core Identity's token-based password reset.
/// </remarks>
public class SetPasswordCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly ITokenRepository TokenRepository;
	private readonly AuthenticationService AuthenticationService;
	private readonly BreachCheckDependencies BreachCheck;
	private readonly FakeTimeProvider TimeProvider;
	private readonly ILogger<SetPasswordCommand> Logger;

	public SetPasswordCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		TokenRepository =
			Substitute.For<ITokenRepository>();
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		// Mock breached password service to return "not breached" by default
		IBreachedPasswordService breachedPasswordService =
			Substitute.For<IBreachedPasswordService>();
		breachedPasswordService
			.CheckPasswordAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(BreachCheckResult.NotBreached());

		// Mock auth settings with breach checking enabled
		Microsoft.Extensions.Options.IOptions<AuthSettings> authSettings =
			Microsoft.Extensions.Options.Options.Create(
				new AuthSettings
				{
					BreachedPassword = new BreachedPasswordSettings
					{
						Enabled = true,
						BlockBreachedPasswords = true,
					},
				});

		// Create compound breach check dependencies
		BreachCheck =
			new BreachCheckDependencies(breachedPasswordService, authSettings);

		Logger =
			Substitute.For<ILogger<SetPasswordCommand>>();
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
	}

	[Fact]
	public async Task HandleAsync_WithInvalidTokenFormat_ThrowsArgumentExceptionAsync()
	{
		// Arrange - Token without colon separator
		SetPasswordRequest request =
			new(
				"invalid-token-without-colon",
				"NewPassword123!");

		SetPasswordCommand command =
			new(request, "127.0.0.1");

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(async () =>
				await SetPasswordCommandHandler.HandleAsync(
					command,
					UserManager,
					TokenRepository,
					AuthenticationService,
					BreachCheck,
					TimeProvider,
					Logger,
					CancellationToken.None));

		exception.ParamName.ShouldBe("Token");
		exception.Message.ShouldContain("Invalid or expired");
	}

	[Fact]
	public async Task HandleAsync_WithInvalidUserId_ThrowsArgumentExceptionAsync()
	{
		// Arrange - Token with non-numeric user ID
		SetPasswordRequest request =
			new(
				"notanumber:sometoken",
				"NewPassword123!");

		SetPasswordCommand command =
			new(request, "127.0.0.1");

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(async () =>
				await SetPasswordCommandHandler.HandleAsync(
					command,
					UserManager,
					TokenRepository,
					AuthenticationService,
					BreachCheck,
					TimeProvider,
					Logger,
					CancellationToken.None));

		exception.ParamName.ShouldBe("Token");
	}

	[Fact]
	public async Task HandleAsync_WithUserNotFound_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		SetPasswordRequest request =
			new("123:validtoken", "NewPassword123!");

		SetPasswordCommand command =
			new(request, "127.0.0.1");

		UserManager
			.FindByIdAsync("123")
			.Returns((ApplicationUser?)null);

		// Act & Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(async () =>
				await SetPasswordCommandHandler.HandleAsync(
					command,
					UserManager,
					TokenRepository,
					AuthenticationService,
					BreachCheck,
					TimeProvider,
					Logger,
					CancellationToken.None));

		exception.Message.ShouldContain("not found or inactive");
	}

	[Fact]
	public async Task HandleAsync_WithInactiveUser_ThrowsInvalidOperationExceptionAsync()
	{
		// Arrange
		ApplicationUser inactiveUser =
			new()
			{
				Id = 123,
				UserName = "inactive",
				Email = "inactive@example.com",
				IsActive = false,
			};

		SetPasswordRequest request =
			new("123:validtoken", "NewPassword123!");

		SetPasswordCommand command =
			new(request, "127.0.0.1");

		UserManager
			.FindByIdAsync("123")
			.Returns(inactiveUser);

		// Act & Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(async () =>
				await SetPasswordCommandHandler.HandleAsync(
					command,
					UserManager,
					TokenRepository,
					AuthenticationService,
					BreachCheck,
					TimeProvider,
					Logger,
					CancellationToken.None));

		exception.Message.ShouldContain("not found or inactive");
	}

	[Fact]
	public async Task HandleAsync_WithValidToken_ResetsPasswordAndReturnsAuthResultAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 456,
				UserName = "testuser",
				Email = "test@example.com",
				IsActive = true,
				RequiresPasswordChange = true,
			};

		SetPasswordRequest request =
			new(
				"456:valid-reset-token",
				"NewSecurePassword123!");

		SetPasswordCommand command =
			new(request, "192.168.1.1");

		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;

		UserManager
			.FindByIdAsync("456")
			.Returns(user);

		UserManager
			.ResetPasswordAsync(
				user,
				"valid-reset-token",
				"NewSecurePassword123!")
			.Returns(IdentityResult.Success);

		AuthResult expectedResult =
			AuthResult.Succeeded(
				"access-token",
				"refresh-token",
				now.AddMinutes(15),
				"test@example.com",
				null,
				false);

		AuthenticationService
			.GenerateAuthResultAsync(
				user,
				"192.168.1.1",
				false,
				false,
				Arg.Any<CancellationToken>())
			.Returns(expectedResult);

		// Act
		AuthResult result =
			await SetPasswordCommandHandler.HandleAsync(
				command,
				UserManager,
				TokenRepository,
				AuthenticationService,
				BreachCheck,
				TimeProvider,
				Logger,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.AccessToken.ShouldBe("access-token");
		result.RefreshToken.ShouldBe("refresh-token");

		await TokenRepository
			.Received(1)
			.RevokeAllUserTokensAsync(
				user.Id,
				now,
				Arg.Any<CancellationToken>());

		await UserManager
			.Received(1)
			.UpdateAsync(Arg.Is<ApplicationUser>(u => u.RequiresPasswordChange == false));
	}

	[Fact]
	public async Task HandleAsync_WithExpiredToken_ThrowsArgumentExceptionAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 789,
				UserName = "expireduser",
				Email = "expired@example.com",
				IsActive = true,
			};

		SetPasswordRequest request =
			new("789:expired-token", "NewPassword123!");

		SetPasswordCommand command =
			new(request, "127.0.0.1");

		UserManager
			.FindByIdAsync("789")
			.Returns(user);

		IdentityError invalidTokenError =
			new() { Code = "InvalidToken", Description = "Invalid token." };

		UserManager
			.ResetPasswordAsync(
				user,
				"expired-token",
				"NewPassword123!")
			.Returns(IdentityResult.Failed(invalidTokenError));

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(async () =>
				await SetPasswordCommandHandler.HandleAsync(
					command,
					UserManager,
					TokenRepository,
					AuthenticationService,
					BreachCheck,
					TimeProvider,
					Logger,
					CancellationToken.None));

		exception.ParamName.ShouldBe("Token");
		exception.Message.ShouldContain("Invalid or expired");
	}
}