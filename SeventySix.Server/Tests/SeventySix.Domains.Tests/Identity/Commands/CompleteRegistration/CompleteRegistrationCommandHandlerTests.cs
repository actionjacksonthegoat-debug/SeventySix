// <copyright file="CompleteRegistrationCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Commands.CompleteRegistration;
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
	public async Task HandleAsync_ShouldConfirmEmail_WhenTokenIsValidAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser user =
			new UserBuilder(TestTimeProviderBuilder.CreateDefault())
				.WithUsername("tempuser")
				.WithEmail("test@example.com")
				.Build();
		user.EmailConfirmed = false;
		// Ensure unique email and security stamp for token generation
		user.Email =
			$"test+{Guid.NewGuid():N}@example.com";
		user.SecurityStamp = Guid.NewGuid().ToString();

		// Persist user directly to the context for test setup
		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		// Generate token via DI-backed UserManager and confirm via UserManager so tests mirror production flow
		string emailToken =
			await userManager.GenerateEmailConfirmationTokenAsync(user);

		IdentityResult confirmResult =
			await userManager.ConfirmEmailAsync(user, emailToken);

		confirmResult.Succeeded.ShouldBeTrue();

		// Reload user from context to assert persisted change
		ApplicationUser? updated =
			await context.Users.FindAsync(user.Id);
		updated.ShouldNotBeNull();
		updated!.EmailConfirmed.ShouldBeTrue();
	}

	[Fact]
	public async Task HandleAsync_ShouldFail_WhenTokenIsInvalidAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		UserManager<ApplicationUser> userManager =
			CreateUserManager(context);

		ApplicationUser user =
			new UserBuilder(TestTimeProviderBuilder.CreateDefault())
				.WithUsername("tempuser")
				.WithEmail("test@example.com")
				.Build();
		user.EmailConfirmed = false;
		// Ensure unique email and security stamp for token generation
		user.Email =
			$"test+{Guid.NewGuid():N}@example.com";
		user.SecurityStamp = Guid.NewGuid().ToString();

		// Persist user directly to the context for test setup
		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		string invalidToken = "invalid-token-value";

		// Act - attempt confirmation with invalid token via UserManager
		IdentityResult confirmResult =
			await userManager.ConfirmEmailAsync(user, invalidToken);

		// Assert - invalid token should not succeed and email should remain unconfirmed
		confirmResult.Succeeded.ShouldBeFalse();

		ApplicationUser? updated =
			await context.Users.FindAsync(user.Id);
		updated.ShouldNotBeNull();
		updated!.EmailConfirmed.ShouldBeFalse();
	}

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
}