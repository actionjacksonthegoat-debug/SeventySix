// <copyright file="IdentityMockFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;

namespace SeventySix.TestUtilities.Mocks;

/// <summary>
/// Factory for creating Identity-related mock objects.
/// Centralizes mock creation to ensure consistency and reduce duplication.
/// </summary>
public static class IdentityMockFactory
{
	/// <summary>
	/// Creates a mock <see cref="UserManager{ApplicationUser}"/> with required constructor parameters.
	/// </summary>
	/// <returns>
	/// A configured NSubstitute mock for UserManager.
	/// </returns>
	public static UserManager<ApplicationUser> CreateUserManager()
	{
		return Substitute.For<UserManager<ApplicationUser>>(
			Substitute.For<IUserStore<ApplicationUser>>(),
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null);
	}

	/// <summary>
	/// Creates a mock <see cref="AuthenticationService"/> with required constructor parameters.
	/// </summary>
	/// <returns>
	/// A configured NSubstitute mock for AuthenticationService.
	/// </returns>
	public static AuthenticationService CreateAuthenticationService()
	{
		return Substitute.For<AuthenticationService>(
			Substitute.For<IAuthRepository>(),
			Substitute.For<ITokenService>(),
			Substitute.For<Microsoft.Extensions.Options.IOptions<JwtSettings>>(),
			Substitute.For<TimeProvider>(),
			CreateUserManager());
	}

	/// <summary>
	/// Creates a mock <see cref="IAltchaService"/> that returns predictable challenges.
	/// Use for tests where ALTCHA functionality is not the test subject.
	/// </summary>
	/// <param name="isEnabled">
	/// Whether ALTCHA should report as enabled. Default true.
	/// </param>
	/// <returns>
	/// A configured NSubstitute mock for IAltchaService.
	/// </returns>
	public static IAltchaService CreateAltchaService(bool isEnabled = true)
	{
		IAltchaService altchaService =
			Substitute.For<IAltchaService>();

		altchaService.IsEnabled.Returns(isEnabled);

		altchaService
			.GenerateChallenge()
			.Returns(
				callInfo =>
					new AltchaChallengeDto(
						Algorithm: "SHA-256",
						Challenge: $"mock-challenge-{Guid.NewGuid():N}",
						MaxNumber: 100000,
						Salt: "mock-salt",
						Signature: "mock-signature"));

		altchaService
			.ValidateAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(AltchaValidationResult.Succeeded());

		return altchaService;
	}
}