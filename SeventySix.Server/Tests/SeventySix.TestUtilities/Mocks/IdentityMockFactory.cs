// <copyright file="IdentityMockFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;

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

	/// <summary>
	/// Creates a mock <see cref="SignInManager{ApplicationUser}"/> with required constructor parameters.
	/// </summary>
	/// <param name="userManager">
	/// The UserManager to associate with the SignInManager.
	/// </param>
	/// <returns>
	/// A configured NSubstitute mock for SignInManager.
	/// </returns>
	public static SignInManager<ApplicationUser> CreateSignInManager(
		UserManager<ApplicationUser> userManager)
	{
		IHttpContextAccessor httpContextAccessor =
			Substitute.For<IHttpContextAccessor>();
		IUserClaimsPrincipalFactory<ApplicationUser> claimsFactory =
			Substitute.For<IUserClaimsPrincipalFactory<ApplicationUser>>();
		IOptions<IdentityOptions> optionsAccessor =
			Substitute.For<IOptions<IdentityOptions>>();
		optionsAccessor.Value.Returns(new IdentityOptions());
		ILogger<SignInManager<ApplicationUser>> signInLogger =
			Substitute.For<ILogger<SignInManager<ApplicationUser>>>();

		SignInManager<ApplicationUser> signInManager =
			Substitute.For<SignInManager<ApplicationUser>>(
				userManager,
				httpContextAccessor,
				claimsFactory,
				optionsAccessor,
				signInLogger,
				null,
				null);

		return signInManager;
	}

	/// <summary>
	/// Configures a UserManager mock to return the specified user when FindByNameAsync is called.
	/// </summary>
	/// <param name="userManager">
	/// The UserManager mock to configure.
	/// </param>
	/// <param name="user">
	/// The user to return.
	/// </param>
	public static void ConfigureUserManagerForSuccess(
		UserManager<ApplicationUser> userManager,
		ApplicationUser user)
	{
		userManager
			.FindByNameAsync(Arg.Any<string>())
			.Returns(user);
	}

	/// <summary>
	/// Configures a SignInManager mock to return SignInResult.Success when CheckPasswordSignInAsync is called.
	/// </summary>
	/// <param name="signInManager">
	/// The SignInManager mock to configure.
	/// </param>
	public static void ConfigureSignInManagerForSuccess(
		SignInManager<ApplicationUser> signInManager)
	{
		signInManager
			.CheckPasswordSignInAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>(),
				Arg.Any<bool>())
			.Returns(SignInResult.Success);
	}

	/// <summary>
	/// Configures an AuthenticationService mock to return a successful AuthResult.
	/// </summary>
	/// <param name="authenticationService">
	/// The AuthenticationService mock to configure.
	/// </param>
	/// <param name="user">
	/// The user for which to generate the auth result.
	/// </param>
	public static void ConfigureAuthServiceForSuccess(
		AuthenticationService authenticationService,
		ApplicationUser user)
	{
		authenticationService
			.GenerateAuthResultAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>(),
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(
				AuthResult.Succeeded(
					accessToken: "test-access-token",
					refreshToken: "test-refresh-token",
					expiresAt: TestDates.FutureUtc,
					email: user.Email!,
					fullName: user.FullName,
					requiresPasswordChange: false));
	}
}