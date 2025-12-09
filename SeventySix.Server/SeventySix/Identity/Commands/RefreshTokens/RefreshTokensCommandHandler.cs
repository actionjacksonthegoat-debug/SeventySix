// <copyright file="RefreshTokensCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Handler for refresh tokens command.
/// </summary>
public static class RefreshTokensCommandHandler
{
	/// <summary>
	/// Handles refresh tokens command.
	/// </summary>
	public static async Task<AuthResult> HandleAsync(
		RefreshTokensCommand command,
		ITokenService tokenService,
		IUserQueryRepository userQueryRepository,
		ICredentialRepository credentialRepository,
		IUserRoleRepository userRoleRepository,
		IOptions<JwtSettings> jwtSettings,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		int? userId =
			await tokenService.ValidateRefreshTokenAsync(
				command.RefreshToken,
				cancellationToken);

		if (userId == null)
		{
			return AuthResult.Failed(
				"Invalid or expired refresh token.",
				AuthErrorCodes.InvalidToken);
		}

		User? user =
			await userQueryRepository.GetByIdAsync(
				userId.Value,
				cancellationToken);

		if (user == null || !user.IsActive)
		{
			return AuthResult.Failed(
				"User account is no longer valid.",
				AuthErrorCodes.AccountInactive);
		}

		string? newRefreshToken =
			await tokenService.RotateRefreshTokenAsync(
				command.RefreshToken,
				command.ClientIp,
				cancellationToken);

		if (newRefreshToken == null)
		{
			return AuthResult.Failed(
				"Token has already been used. Please login again.",
				AuthErrorCodes.TokenReuse);
		}

		UserCredential? credential =
			await credentialRepository.GetByUserIdAsync(
				user.Id,
				cancellationToken);

		bool requiresPasswordChange =
			credential?.PasswordChangedAt == null;

		IEnumerable<string> roles =
			await userRoleRepository.GetUserRolesAsync(
				user.Id,
				cancellationToken);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				roles.ToList());

		DateTime expiresAt =
			timeProvider.GetUtcNow()
				.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
				.UtcDateTime;

		return AuthResult.Succeeded(
			accessToken,
			newRefreshToken,
			expiresAt,
			requiresPasswordChange);
	}
}