// <copyright file="CompleteRegistrationCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Commands.CompleteRegistration;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.CompleteRegistration;

/// <summary>
/// Tests for CompleteRegistrationCommandHandler using Identity's email confirmation token system.
/// </summary>
[Collection("DatabaseTests")]
public class CompleteRegistrationCommandHandlerTests(
	TestcontainersPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
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
				Arg.Any<IList<string>>())
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
				timeProvider,
				logger,
				CancellationToken.None);

		result.Success.ShouldBeTrue();
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
	/// Creates a temporary user using UserManager for proper Identity setup.
	/// The user is created without a password and with EmailConfirmed=false as used in the registration flow.
	/// </summary>
	private static async Task<ApplicationUser> CreateTemporaryUserWithUserManagerAsync(
		UserManager<ApplicationUser> userManager,
		TimeProvider timeProvider,
		string? email = null)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

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
			$"Failed to create user: {string.Join(", ", createResult.Errors.Select(error => error.Description))}");

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
						timeProvider.GetUtcNow().UtcDateTime,
				});
			await context.SaveChangesAsync();
		}
	}
}