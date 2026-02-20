// <copyright file="AccountLockoutTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SeventySix.Identity;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Security;

/// <summary>
/// Tests for account lockout configuration.
/// Per 80/20 rule: Verify lockout settings are correctly configured.
/// The actual lockout mechanism is handled by ASP.NET Identity (already well-tested).
/// Unit tests in LoginCommandHandlerTests verify the handler responds correctly to LockedOut status.
/// </summary>
public sealed class AccountLockoutTests : IDisposable
{
	private readonly SharedWebApplicationFactory<Program> Factory;

	/// <summary>
	/// Initializes a new instance of the <see cref="AccountLockoutTests"/> class.
	/// </summary>
	public AccountLockoutTests()
	{
		Factory =
			new SharedWebApplicationFactory<Program>(
				connectionString: "InMemory");
	}

	/// <summary>
	/// Tests that the max failed access attempts is configured to 5.
	/// This protects against brute-force attacks (OWASP A7:2017).
	/// </summary>
	[Fact]
	public void IdentityOptions_MaxFailedAccessAttempts_IsFive()
	{
		// Arrange
		using IServiceScope scope =
			Factory.Services.CreateScope();
		IOptions<Microsoft.AspNetCore.Identity.IdentityOptions> identityOptions =
			scope.ServiceProvider.GetRequiredService<IOptions<Microsoft.AspNetCore.Identity.IdentityOptions>>();

		// Assert
		identityOptions.Value.Lockout.MaxFailedAccessAttempts.ShouldBe(5);
	}

	/// <summary>
	/// Tests that lockout duration is configured to 15 minutes.
	/// This provides a reasonable delay without permanently locking accounts.
	/// </summary>
	[Fact]
	public void IdentityOptions_LockoutDuration_IsFifteenMinutes()
	{
		// Arrange
		using IServiceScope scope =
			Factory.Services.CreateScope();
		IOptions<Microsoft.AspNetCore.Identity.IdentityOptions> identityOptions =
			scope.ServiceProvider.GetRequiredService<IOptions<Microsoft.AspNetCore.Identity.IdentityOptions>>();

		// Assert
		identityOptions.Value.Lockout.DefaultLockoutTimeSpan.ShouldBe(TimeSpan.FromMinutes(15));
	}

	/// <summary>
	/// Tests that lockout is enabled for new users.
	/// New accounts should be protected from brute-force attacks from day one.
	/// </summary>
	[Fact]
	public void IdentityOptions_AllowedForNewUsers_IsTrue()
	{
		// Arrange
		using IServiceScope scope =
			Factory.Services.CreateScope();
		IOptions<Microsoft.AspNetCore.Identity.IdentityOptions> identityOptions =
			scope.ServiceProvider.GetRequiredService<IOptions<Microsoft.AspNetCore.Identity.IdentityOptions>>();

		// Assert
		identityOptions.Value.Lockout.AllowedForNewUsers.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that AuthSettings lockout configuration matches Identity settings.
	/// Ensures app-level settings are in sync with Identity configuration.
	/// </summary>
	[Fact]
	public void AuthSettings_LockoutSettings_MatchIdentityOptions()
	{
		// Arrange
		using IServiceScope scope =
			Factory.Services.CreateScope();
		IOptions<AuthSettings> authSettings =
			scope.ServiceProvider.GetRequiredService<IOptions<AuthSettings>>();
		IOptions<Microsoft.AspNetCore.Identity.IdentityOptions> identityOptions =
			scope.ServiceProvider.GetRequiredService<IOptions<Microsoft.AspNetCore.Identity.IdentityOptions>>();

		// Assert - AuthSettings lockout should match Identity lockout
		authSettings.Value.Lockout.MaxFailedAttempts.ShouldBe(
			identityOptions.Value.Lockout.MaxFailedAccessAttempts);
		authSettings.Value.Lockout.LockoutDurationMinutes.ShouldBe(
			(int)identityOptions.Value.Lockout.DefaultLockoutTimeSpan.TotalMinutes);
	}

	/// <inheritdoc/>
	public void Dispose() =>
		Factory.Dispose();
}