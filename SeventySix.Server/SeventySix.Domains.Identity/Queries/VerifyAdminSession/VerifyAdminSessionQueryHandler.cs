// <copyright file="VerifyAdminSessionQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="VerifyAdminSessionQuery"/>.
/// Validates a refresh token and checks that the associated user has Admin role.
/// </summary>
/// <remarks>
/// This handler is invoked by the verify-admin API endpoint, which is called
/// by nginx auth_request on every request to observability proxy locations
/// (/grafana/, /jaeger/, /prometheus/). It must be lightweight because nginx
/// fires a subrequest for each static asset, API call, and WebSocket connection.
/// </remarks>
public static class VerifyAdminSessionQueryHandler
{
	/// <summary>
	/// Validates the refresh token and confirms the user has Admin role.
	/// </summary>
	/// <param name="query">
	/// The query containing the plaintext refresh token.
	/// </param>
	/// <param name="tokenService">
	/// Token service for refresh token validation.
	/// </param>
	/// <param name="userManager">
	/// User manager for role checks.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the token is valid and the user is an active admin; false otherwise.
	/// </returns>
	public static async Task<bool> HandleAsync(
		VerifyAdminSessionQuery query,
		ITokenService tokenService,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		long? userId =
			await tokenService.ValidateRefreshTokenAsync(
				query.RefreshToken,
				cancellationToken);

		if (userId is null)
		{
			return false;
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(
				userId.Value.ToString(
					System.Globalization.CultureInfo.InvariantCulture));

		if (user is null || !user.IsActive)
		{
			return false;
		}

		return await userManager.IsInRoleAsync(
			user,
			RoleConstants.Admin);
	}
}