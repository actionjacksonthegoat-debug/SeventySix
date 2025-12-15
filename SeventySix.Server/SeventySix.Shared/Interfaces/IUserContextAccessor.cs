// <copyright file="IUserContextAccessor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>Access to current user context for audit tracking.</summary>
public interface IUserContextAccessor
{
	public string GetCurrentUser();
}
