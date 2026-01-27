// <copyright file="LimitInterval.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Enums;

/// <summary>
/// Defines the interval for rate limit tracking.
/// </summary>
public enum LimitInterval
{
	/// <summary>
	/// Limit resets daily at midnight UTC.
	/// </summary>
	Daily,

	/// <summary>
	/// Limit resets monthly on the 1st at midnight UTC.
	/// </summary>
	Monthly
}