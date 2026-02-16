// <copyright file="DisableTotpCommandHandlerUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands.DisableTotp;

/// <summary>
/// Unit tests for <see cref="DisableTotpCommandHandler"/>.
/// Verifies TOTP disable clears enrollment and MFA state.
/// </summary>
public class DisableTotpCommandHandlerUnitTests
{
	private readonly FakeTimeProvider TimeProvider;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly ISecurityAuditService SecurityAuditService;

	/// <summary>
	/// Initializes a new instance of the <see cref="DisableTotpCommandHandlerUnitTests"/> class.
	/// </summary>
	public DisableTotpCommandHandlerUnitTests()
	{
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
	}

	/// <summary>
	/// Tests that TOTP disable clears secret, enrolled date, and MFA enabled flag.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ValidPassword_ClearsTotpAndMfaEnabledAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithMfaEnabled(true)
				.WithTotpSecret("JBSWY3DPEHPK3PXP")
				.WithTotpEnrolledAt(TimeProvider.GetUtcNow())
				.Build();

		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		UserManager
			.CheckPasswordAsync(user, "ValidPassword123!")
			.Returns(true);

		UserManager
			.UpdateAsync(user)
			.Returns(IdentityResult.Success);

		DisableTotpCommand command =
			new(
				user.Id,
				new DisableTotpRequest("ValidPassword123!"));

		// Act
		Shared.POCOs.Result result =
			await DisableTotpCommandHandler.HandleAsync(
				command,
				UserManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		user.TotpSecret.ShouldBeNull();
		user.TotpEnrolledAt.ShouldBeNull();
		user.MfaEnabled.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that TOTP disable fails with invalid password.
	/// </summary>
	[Fact]
	public async Task HandleAsync_InvalidPassword_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithMfaEnabled(true)
				.WithTotpSecret("JBSWY3DPEHPK3PXP")
				.WithTotpEnrolledAt(TimeProvider.GetUtcNow())
				.Build();

		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		UserManager
			.CheckPasswordAsync(user, "WrongPassword!")
			.Returns(false);

		DisableTotpCommand command =
			new(
				user.Id,
				new DisableTotpRequest("WrongPassword!"));

		// Act
		Shared.POCOs.Result result =
			await DisableTotpCommandHandler.HandleAsync(
				command,
				UserManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		user.MfaEnabled.ShouldBeTrue();
		user.TotpSecret.ShouldNotBeNull();
	}

	/// <summary>
	/// Tests that TOTP disable fails when TOTP is not configured.
	/// </summary>
	[Fact]
	public async Task HandleAsync_TotpNotConfigured_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(1)
				.Build();

		UserManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		DisableTotpCommand command =
			new(
				user.Id,
				new DisableTotpRequest("AnyPassword!"));

		// Act
		Shared.POCOs.Result result =
			await DisableTotpCommandHandler.HandleAsync(
				command,
				UserManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.IsSuccess.ShouldBeFalse();
	}
}