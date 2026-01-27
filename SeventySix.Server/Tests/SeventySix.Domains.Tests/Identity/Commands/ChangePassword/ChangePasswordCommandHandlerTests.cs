using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.ChangePassword;

public class ChangePasswordCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly ITokenRepository TokenRepository;
	private readonly AuthenticationService AuthenticationService;
	private readonly BreachCheckDependencies BreachCheck;
	private readonly TimeProvider TimeProvider;
	private readonly ILogger<ChangePasswordCommand> Logger;

	public ChangePasswordCommandHandlerTests()
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

		TimeProvider =
			Substitute.For<TimeProvider>();
		Logger =
			Substitute.For<ILogger<ChangePasswordCommand>>();
	}

	[Fact]
	public async Task HandleAsync_WhenRequiresPasswordChange_ClearsFlagInDatabaseAsync()
	{
		// Arrange
		long userId = 123;
		ApplicationUser user =
			CreateTestUser(
				userId,
				requiresPasswordChange: true);

		SetupUserManagerMocks(user);
		SetupAuthResultMock(user);

		ChangePasswordCommand command =
			CreateCommand(userId);

		// Act
		AuthResult result =
			await ChangePasswordCommandHandler.HandleAsync(
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
		await TokenRepository
			.Received(1)
			.RevokeAllUserTokensAsync(
				userId,
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>());
		await UserManager
			.Received(1)
			.UpdateAsync(
				Arg.Is<ApplicationUser>(updatedUser =>
					!updatedUser.RequiresPasswordChange));
	}

	private static ApplicationUser CreateTestUser(
		long userId,
		bool requiresPasswordChange)
	{
		return new()
		{
			Id = userId,
			UserName = "testuser",
			Email = "test@example.com",
			IsActive = true,
			RequiresPasswordChange =
				requiresPasswordChange,
		};
	}

	private void SetupUserManagerMocks(ApplicationUser user)
	{
		UserManager.FindByIdAsync(user.Id.ToString()).Returns(user);
		UserManager.HasPasswordAsync(user).Returns(true);
		UserManager
			.ChangePasswordAsync(
				user,
				Arg.Any<string>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);
		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);
	}

	private void SetupAuthResultMock(ApplicationUser user)
	{
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;
		AuthResult expectedResult =
			AuthResult.Succeeded(
			"access-token",
			"refresh-token",
			now.AddMinutes(15),
			user.Email!,
			null,
			false);

		AuthenticationService
			.GenerateAuthResultAsync(
				user,
				Arg.Any<string?>(),
				false,
				false,
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedResult));
	}

	private static ChangePasswordCommand CreateCommand(long userId)
	{
		ChangePasswordRequest request =
			new("OldPass123!", "NewPass123!");
		return new(userId, request);
	}
}