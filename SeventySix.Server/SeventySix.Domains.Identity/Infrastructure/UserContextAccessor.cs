// <copyright file="UserContextAccessor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Identity.Infrastructure;

/// <summary>
/// Provides access to the current authenticated user from HttpContext.
/// Falls back to "System" for unauthenticated requests (background jobs, etc.).
/// </summary>
public sealed class UserContextAccessor(IHttpContextAccessor httpContextAccessor)
	: IUserContextAccessor
{
	/// <summary>
	/// Gets the current user's username from JWT claims.
	/// </summary>
	/// <returns>
	/// The authenticated username or "System" if not authenticated.
	/// </returns>
	public string GetCurrentUser()
	{
		string? username =
			httpContextAccessor
				.HttpContext?
				.User?
				.FindFirst(JwtRegisteredClaimNames.UniqueName)
				?.Value;

		return username ?? AuditConstants.SystemUser;
	}
}