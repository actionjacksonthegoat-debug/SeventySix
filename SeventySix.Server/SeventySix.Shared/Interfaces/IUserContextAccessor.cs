// <copyright file="IUserContextAccessor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>Access to current user context for audit tracking.</summary>
public interface IUserContextAccessor
{
	/// <summary>
	/// Gets the identifier of the current user for audit purposes.
	/// </summary>
	/// <returns>
	/// A string representing the current user (for example a username or service account identifier).
	/// </returns>
	public string GetCurrentUser();
}