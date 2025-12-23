// <copyright file="ClaimsPrincipalExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Extension methods for <see cref="ClaimsPrincipal"/> to extract JWT claims.
/// </summary>
public static class ClaimsPrincipalExtensions
{
	/// <summary>
	/// Gets the user ID from the JWT 'sub' claim.
	/// </summary>
	/// <param name="principal">
	/// The claims principal.
	/// </param>
	/// <returns>
	/// The user ID if present and valid; otherwise, null.
	/// </returns>
	public static int? GetUserId(this ClaimsPrincipal principal)
	{
		string? userIdClaim =
			principal.FindFirstValue(
				JwtRegisteredClaimNames.Sub);

		return int.TryParse(userIdClaim, out int userId) ? userId : null;
	}

	/// <summary>
	/// Gets the user ID from the JWT 'sub' claim, throwing if not present.
	/// </summary>
	/// <param name="principal">
	/// The claims principal.
	/// </param>
	/// <returns>
	/// The user ID.
	/// </returns>
	/// <exception cref="UnauthorizedAccessException">If user ID claim is missing or invalid.</exception>
	public static int GetRequiredUserId(this ClaimsPrincipal principal)
	{
		return principal.GetUserId()
			?? throw new UnauthorizedAccessException(
				"User ID not found in claims");
	}

	/// <summary>
	/// Gets the username from the JWT 'unique_name' claim.
	/// </summary>
	/// <param name="principal">
	/// The claims principal.
	/// </param>
	/// <returns>
	/// The username if present; otherwise, null.
	/// </returns>
	public static string? GetUsername(this ClaimsPrincipal principal)
	{
		return principal.FindFirstValue(JwtRegisteredClaimNames.UniqueName);
	}

	/// <summary>
	/// Gets the username from the JWT 'unique_name' claim, throwing if not present.
	/// </summary>
	/// <param name="principal">
	/// The claims principal.
	/// </param>
	/// <returns>
	/// The username.
	/// </returns>
	/// <exception cref="UnauthorizedAccessException">If username claim is missing.</exception>
	public static string GetRequiredUsername(this ClaimsPrincipal principal)
	{
		return principal.GetUsername()
			?? throw new UnauthorizedAccessException(
				"Username not found in claims");
	}
}