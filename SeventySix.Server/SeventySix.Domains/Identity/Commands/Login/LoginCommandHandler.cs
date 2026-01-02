// <copyright file="LoginCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace SeventySix.Identity;

/// <summary>
/// Handler for login command.
/// </summary>
/// <remarks>
/// Thin wrapper that delegates credential checks to Identity's <see cref="SignInManager{TUser}"/> and preserves lockout semantics.
/// </remarks>
public static class LoginCommandHandler
{
	/// <summary>
	/// Handles login command by delegating credential validation to Identity's <see cref="SignInManager{TUser}"/>.
	/// </summary>
	/// <param name="command">
	/// The login command containing credentials and options.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user lookups.
	/// </param>
	/// <param name="signInManager">
	/// Identity <see cref="SignInManager{TUser}"/> for password checks and lockout.
	/// </param>
	/// <param name="authenticationService">
	/// Service to generate auth tokens on success.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// An <see cref="AuthResult"/> indicating authentication result.
	/// </returns>
	public static async Task<AuthResult> HandleAsync(
		LoginCommand command,
		UserManager<ApplicationUser> userManager,
		SignInManager<ApplicationUser> signInManager,
		AuthenticationService authenticationService,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByNameAsync(command.Request.UsernameOrEmail)
				?? await userManager.FindByEmailAsync(command.Request.UsernameOrEmail);

		if (user is null || !user.IsActive)
		{
			return AuthResult.Failed(
				"Invalid credentials",
				"INVALID_CREDENTIALS");
		}

		SignInResult result =
			await signInManager.CheckPasswordSignInAsync(
				user,
				command.Request.Password,
				lockoutOnFailure: true);

		if (result.IsLockedOut)
		{
			return AuthResult.Failed(
				"Account locked",
				"ACCOUNT_LOCKED");
		}

		if (!result.Succeeded)
		{
			return AuthResult.Failed(
				"Invalid credentials",
				"INVALID_CREDENTIALS");
		}

		// Determine if the user must change password on first login by checking DB flag
		bool requiresPasswordChange =
			user.RequiresPasswordChange;

		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			requiresPasswordChange,
			command.Request.RememberMe,
			cancellationToken);
	}

}