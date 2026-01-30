using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.ChangePassword;

public class ChangePasswordCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly ITokenRepository TokenRepository;
	private readonly AuthenticationService AuthenticationService;
	private readonly IIdentityCacheService IdentityCache;
	private readonly BreachCheckDependencies BreachCheck;
	private readonly FakeTimeProvider TimeProvider;
	private readonly ILogger<ChangePasswordCommand> Logger;

	public ChangePasswordCommandHandlerTests()
	{
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		TokenRepository =
			Substitute.For<ITokenRepository>();
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();
		IdentityCache =
			Substitute.For<IIdentityCacheService>();

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
			Substitute.For<ILogger<ChangePasswordCommand>>();
	}

	[Fact]
	public async Task HandleAsync_WhenRequiresPasswordChange_ClearsFlagInDatabaseAsync()
	{
		// Arrange
		long userId = 123;
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(userId)
				.WithUsername("testuser")
				.WithEmail("test@example.com")
				.WithIsActive(true)
				.WithRequiresPasswordChange(true)
				.Build();

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
				IdentityCache,
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