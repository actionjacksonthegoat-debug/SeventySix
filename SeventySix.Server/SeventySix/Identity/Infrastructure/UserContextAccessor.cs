// <copyright file="UserContextAccessor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity.Infrastructure;

/// <summary>
/// Stub implementation of user context accessor.
/// </summary>
/// <remarks>
/// TODO: Implement authentication integration to retrieve actual user from HttpContext.
/// Requires JWT/OAuth middleware configuration and claims parsing.
/// </remarks>
public class UserContextAccessor : IUserContextAccessor
{
	/// <summary>
	/// Gets the current user identifier.
	/// </summary>
	/// <returns>Always returns "System" until authentication is implemented.</returns>
	public string GetCurrentUser()
	{
		// TODO: Replace with actual user retrieval from HttpContext or authentication context
		// Example: httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "System"
		return "System";
	}
}