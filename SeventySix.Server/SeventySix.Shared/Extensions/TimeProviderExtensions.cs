// <copyright file="TimeProviderExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Extension methods for <see cref="TimeProvider"/>.
/// </summary>
public static class TimeProviderExtensions
{
	/// <summary>
	/// Gets the current UTC date and time as a <see cref="DateTime"/>.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider.
	/// </param>
	/// <returns>
	/// The current UTC <see cref="DateTime"/>.
	/// </returns>
	/// <remarks>
	/// DRY: Consolidates the common `timeProvider.GetUtcNow().UtcDateTime` pattern.
	/// </remarks>
	public static DateTime GetCurrentUtc(this TimeProvider timeProvider) =>
		timeProvider.GetUtcNow().UtcDateTime;
}