// <copyright file="IUserContextAccessor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// Provides access to the current user context for audit tracking.
/// </summary>
public interface IUserContextAccessor
{
	/// <summary>
	/// Gets the current user identifier for audit purposes.
	/// </summary>
	/// <returns>User identifier (username, email, or "System").</returns>
	public string GetCurrentUser();
}
