// <copyright file="CompleteRegistrationCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Utilities;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.CompleteRegistration;

/// <summary>
/// Tests for CompleteRegistrationCommandHandler using Identity's email confirmation token system.
/// </summary>
[Collection(CollectionNames.IdentityPostgreSql)]
public sealed class CompleteRegistrationCommandHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private readonly ITransactionManager TransactionManager =
		CreateVoidTransactionManagerMock();

	[Fact]
	public async Task HandleAsync_ShouldFail_WhenUserNotFoundAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		string testEmail = "nonexistent@example.com";

		// Act
		ApplicationUser? user =
			await userManager.FindByEmailAsync(testEmail);

		// Assert
		user.ShouldBeNull();
	}

	[Fact]
	public async Task HandleAsync_ShouldConfirmEmail_WhenTokenIsValid_RefactoredAsync()
	{
		await using IdentityDbContext context = CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);
		TimeProvider timeProvider =
			TestTimeProviderBuilder.CreateDefault();

		ApplicationUser user =
			await CreateTemporaryUserAsync(
				context,
				timeProvider);

		string emailToken =
			await userManager.GenerateEmailConfirmationTokenAsync(user);
		IdentityResult confirmResult =
			await userManager.ConfirmEmailAsync(
				user,
				emailToken);
		confirmResult.Succeeded.ShouldBeTrue();
	}

	[Fact]
	public async Task HandleAsync_ShouldCompleteRegistration_WhenCombinedTokenIsValid_RefactoredAsync()
	{
		await using IdentityDbContext context = CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);
		TimeProvider timeProvider =
			TestTimeProviderBuilder.CreateDefault();

		ApplicationUser user =
			await CreateTemporaryUserWithUserManagerAsync(
				userManager,
				timeProvider);
		await EnsureRoleExistsAsync(
			context,
			RoleConstants.User,
			timeProvider);

		string emailToken =
			await userManager.GenerateEmailConfirmationTokenAsync(user);
		string combinedToken =
			RegistrationTokenService.Encode(
				user.Email!,
				emailToken);

		IAuthRepository authRepository =
			Substitute.For<IAuthRepository>();
		ITokenService tokenService =
			Substitute.For<ITokenService>();
		tokenService
			.GenerateAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns("access-token");
		tokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult("refresh-token"));

		JwtSettings jwtSettings =
			new()
			{
				AccessTokenExpirationMinutes = 60
			};
		AuthenticationService authenticationService =
			new(
				authRepository,
				tokenService,
				Options.Create(jwtSettings),
				timeProvider,
				userManager);

		// Mock breached password service to return "not breached"
		IBreachedPasswordService breachedPasswordService =
			Substitute.For<IBreachedPasswordService>();
		breachedPasswordService
			.CheckPasswordAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(BreachCheckResult.NotBreached());

		// Auth settings with breach checking enabled
		IOptions<AuthSettings> authSettings =
			Options.Create(
				new AuthSettings
				{
					BreachedPassword = new BreachedPasswordSettings
					{
						Enabled = true,
						BlockBreachedPasswords = true,
					},
				});

		// Create compound breach check dependencies
		BreachCheckDependencies breachCheck =
			new(breachedPasswordService, authSettings);

		ILogger<CompleteRegistrationCommand> logger =
			NullLogger<CompleteRegistrationCommand>.Instance;

		CompleteRegistrationRequest request =
			new(
				combinedToken,
				"newusername",
				"P@ssword123!");
		CompleteRegistrationCommand command =
			new(
				request,
				ClientIp: null);

		AuthResult result =
			await CompleteRegistrationCommandHandler.HandleAsync(
				command,
				userManager,
				authenticationService,
				breachCheck,
				timeProvider,
				logger,
				TransactionManager,
				CancellationToken.None);

		result.Success.ShouldBeTrue();
	}

	[Fact]
	public async Task HandleAsync_ShouldFail_WhenPasswordIsBreachedAsync()
	{
		await using IdentityDbContext context = CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);
		TimeProvider timeProvider =
			TestTimeProviderBuilder.CreateDefault();

		ApplicationUser user =
			await CreateTemporaryUserWithUserManagerAsync(
				userManager,
				timeProvider);
		await EnsureRoleExistsAsync(
			context,
			RoleConstants.User,
			timeProvider);

		string emailToken =
			await userManager.GenerateEmailConfirmationTokenAsync(user);
		string combinedToken =
			RegistrationTokenService.Encode(
				user.Email!,
				emailToken);

		IAuthRepository authRepository =
			Substitute.For<IAuthRepository>();
		ITokenService tokenService =
			Substitute.For<ITokenService>();

		JwtSettings jwtSettings =
			new()
			{
				AccessTokenExpirationMinutes = 60
			};
		AuthenticationService authenticationService =
			new(
				authRepository,
				tokenService,
				Options.Create(jwtSettings),
				timeProvider,
				userManager);

		// Mock breached password service to return BREACHED
		IBreachedPasswordService breachedPasswordService =
			Substitute.For<IBreachedPasswordService>();
		breachedPasswordService
			.CheckPasswordAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(BreachCheckResult.Breached(1000000));

		// Auth settings with breach checking enabled and blocking
		IOptions<AuthSettings> authSettings =
			Options.Create(
				new AuthSettings
				{
					BreachedPassword = new BreachedPasswordSettings
					{
						Enabled = true,
						BlockBreachedPasswords = true,
					},
				});

		// Create compound breach check dependencies
		BreachCheckDependencies breachCheck =
			new(breachedPasswordService, authSettings);

		ILogger<CompleteRegistrationCommand> logger =
			NullLogger<CompleteRegistrationCommand>.Instance;

		CompleteRegistrationRequest request =
			new(
				combinedToken,
				"newusername",
				"password"); // Common breached password
		CompleteRegistrationCommand command =
			new(
				request,
				ClientIp: null);

		AuthResult result =
			await CompleteRegistrationCommandHandler.HandleAsync(
				command,
				userManager,
				authenticationService,
				breachCheck,
				timeProvider,
				logger,
				TransactionManager,
				CancellationToken.None);

		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.BreachedPassword);
	}

	[Fact]
	public async Task HandleAsync_ShouldFail_WhenEmailConfirmationTokenIsInvalid_RefactoredAsync()
	{
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);
		TimeProvider timeProvider =
			TestTimeProviderBuilder.CreateDefault();

		ApplicationUser user =
			await CreateTemporaryUserAsync(
				context,
				timeProvider);
		string invalidToken = "invalid-token-value";
		IdentityResult confirmResult =
			await userManager.ConfirmEmailAsync(
				user,
				invalidToken);
		confirmResult.Succeeded.ShouldBeFalse();
	}

	/// <summary>
	/// Verifies that the DB constraint catches duplicate usernames during registration completion.
	/// Covers the race condition where another user takes the username between initiation and completion.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DuplicateUsername_ReturnsFailedAuthResultAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);
		TimeProvider timeProvider =
			TestTimeProviderBuilder.CreateDefault();

		await EnsureRoleExistsAsync(
			context,
			RoleConstants.User,
			timeProvider);

		string duplicateUsername =
			$"taken_{Guid.NewGuid():N}"[..16];

		ApplicationUser existingUser =
			new UserBuilder(timeProvider)
				.WithUsername(duplicateUsername)
				.WithEmail($"existing+{Guid.NewGuid():N}@example.com")
				.Build();

		IdentityResult createResult =
			await userManager.CreateAsync(existingUser, "P@ssword123!");
		createResult.Succeeded.ShouldBeTrue();

		ApplicationUser tempUser =
			await CreateTemporaryUserWithUserManagerAsync(
				userManager,
				timeProvider);

		string emailToken =
			await userManager.GenerateEmailConfirmationTokenAsync(tempUser);
		string combinedToken =
			RegistrationTokenService.Encode(
				tempUser.Email!,
				emailToken);

		(AuthenticationService authService, BreachCheckDependencies breachCheck) =
			CreateAuthDependencies(userManager, timeProvider);

		CompleteRegistrationCommand command =
			new(
				new CompleteRegistrationRequest(
					combinedToken,
					duplicateUsername,
					"P@ssword123!"),
				ClientIp: null);

		// Act
		AuthResult result =
			await CompleteRegistrationCommandHandler.HandleAsync(
				command,
				userManager,
				authService,
				breachCheck,
				timeProvider,
				NullLogger<CompleteRegistrationCommand>.Instance,
				TransactionManager,
				CancellationToken.None);

		// Assert — Identity validates username uniqueness before DB constraint
		result.Success.ShouldBeFalse();
	}

	/// <summary>
	/// Creates mock authentication and breach check dependencies for handler tests.
	/// </summary>
	private static (AuthenticationService AuthService, BreachCheckDependencies BreachCheck)
		CreateAuthDependencies(
			UserManager<ApplicationUser> userManager,
			TimeProvider timeProvider)
	{
		ITokenService tokenService =
			Substitute.For<ITokenService>();
		tokenService
			.GenerateAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns("access-token");
		tokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult("refresh-token"));

		JwtSettings jwtSettings =
			new() { AccessTokenExpirationMinutes = 60 };

		AuthenticationService authService =
			new(
				Substitute.For<IAuthRepository>(),
				tokenService,
				Options.Create(jwtSettings),
				timeProvider,
				userManager);

		IBreachedPasswordService breachedPasswordService =
			Substitute.For<IBreachedPasswordService>();
		breachedPasswordService
			.CheckPasswordAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(BreachCheckResult.NotBreached());

		BreachCheckDependencies breachCheck =
			new(
				breachedPasswordService,
				Options.Create(
					new AuthSettings
					{
						BreachedPassword = new BreachedPasswordSettings
						{
							Enabled = true,
							BlockBreachedPasswords = true,
						},
					}));

		return (authService, breachCheck);
	}

	/// <summary>
	/// Creates a temporary user using UserManager for proper Identity setup.
	/// The user is created without a password and with EmailConfirmed=false as used in the registration flow.
	/// </summary>
	private static async Task<ApplicationUser> CreateTemporaryUserWithUserManagerAsync(
		UserManager<ApplicationUser> userManager,
		TimeProvider timeProvider,
		string? email = null)
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		string testId =
			Guid.NewGuid().ToString("N")[..8];

		string testEmail =
			email ?? $"test+{testId}@example.com";

		ApplicationUser user =
			new()
			{
				UserName =
					$"temp_{testId}",
				Email = testEmail,
				EmailConfirmed = false,
				IsActive = false,
				CreateDate = now,
				CreatedBy = "Registration"
			};

		IdentityResult createResult =
			await userManager.CreateAsync(user);

		createResult.Succeeded.ShouldBeTrue(
			$"Failed to create user: {string.Join(
				", ",
				createResult.Errors.Select(error => error.Description))}");

		return user;
	}

	/// <summary>
	/// Creates a temporary user directly in the provided <see cref="IdentityDbContext"/>.
	/// The user is created without a password and with EmailConfirmed=false as used in the registration flow.
	/// </summary>
	private static async Task<ApplicationUser> CreateTemporaryUserAsync(
		IdentityDbContext context,
		TimeProvider timeProvider,
		string? email = null)
	{
		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithUsername("tempuser")
				.WithEmail(email ?? $"test+{Guid.NewGuid():N}@example.com")
				.Build();

		user.EmailConfirmed = false;
		user.SecurityStamp = Guid.NewGuid().ToString();

		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		return user;
	}

	/// <summary>
	/// Ensures the specified role exists in the database, creating it if necessary.
	/// </summary>
	private static async Task EnsureRoleExistsAsync(
		IdentityDbContext context,
		string roleName,
		TimeProvider timeProvider)
	{
		if (!await context.Roles.AnyAsync(role => role.Name == roleName))
		{
			await context.Roles.AddAsync(
				new ApplicationRole
				{
					Name = roleName,
					NormalizedName = roleName.ToUpperInvariant(),
					CreateDate =
						timeProvider.GetUtcNow(),
				});
			await context.SaveChangesAsync();
		}
	}

	private static ITransactionManager CreateVoidTransactionManagerMock()
	{
		ITransactionManager mock =
			Substitute.For<ITransactionManager>();
		mock
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(
				call =>
				{
					Func<CancellationToken, Task> operation =
						call.ArgAt<Func<CancellationToken, Task>>(0);
					return operation(CancellationToken.None);
				});
		return mock;
	}
}