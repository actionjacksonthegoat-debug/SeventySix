// <copyright file="TestDates.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;

namespace SeventySix.TestUtilities.Constants;

/// <summary>
/// Centralized test date constants for deterministic, maintainable tests.
/// Single source of truth for all date values used across the test suite.
/// </summary>
/// <remarks>
/// Usage Guidelines:
/// - Use <see cref="Default"/> for standard test scenarios
/// - Use <see cref="Historical"/> for "created in the past" scenarios
/// - Use <see cref="Future"/> for expiration/scheduling scenarios
/// - Use <see cref="Modification"/> for "entity was modified" scenarios
///
/// All dates use UTC timezone (TimeSpan.Zero) for consistency.
/// </remarks>
public static class TestDates
{
	#region Primary Test Dates (Use These First)

	/// <summary>
	/// Default test date: 2025-01-15 12:00:00 UTC.
	/// Use for: Standard test scenarios, "current time" in tests.
	/// </summary>
	public static readonly DateTimeOffset Default =
		new(
			2025,
			1,
			15,
			12,
			0,
			0,
			TimeSpan.Zero);

	/// <summary>
	/// Historical date: 2024-01-15 10:30:00 UTC.
	/// Use for: Entity creation dates, "was created before" scenarios.
	/// </summary>
	public static readonly DateTimeOffset Historical =
		new(
			2024,
			1,
			15,
			10,
			30,
			0,
			TimeSpan.Zero);

	/// <summary>
	/// Future date: 2026-01-15 12:00:00 UTC.
	/// Use for: Token expiration, scheduled jobs, future events.
	/// </summary>
	public static readonly DateTimeOffset Future =
		new(
			2026,
			1,
			15,
			12,
			0,
			0,
			TimeSpan.Zero);

	/// <summary>
	/// Modification date: 2025-01-16 14:00:00 UTC.
	/// Use for: Entity modification timestamps, "after update" scenarios.
	/// </summary>
	public static readonly DateTimeOffset Modification =
		new(
			2025,
			1,
			16,
			14,
			0,
			0,
			TimeSpan.Zero);

	#endregion

	#region DateTimeOffset Conversions (For APIs requiring DateTimeOffset)

	/// <summary>
	/// Default date as UTC DateTimeOffset.
	/// </summary>
	public static DateTimeOffset DefaultUtc =>
		Default.UtcDateTime;

	/// <summary>
	/// Historical date as UTC DateTimeOffset.
	/// </summary>
	public static DateTimeOffset HistoricalUtc =>
		Historical.UtcDateTime;

	/// <summary>
	/// Future date as UTC DateTimeOffset.
	/// </summary>
	public static DateTimeOffset FutureUtc =>
		Future.UtcDateTime;

	/// <summary>
	/// Modification date as UTC DateTimeOffset.
	/// </summary>
	public static DateTimeOffset ModificationUtc =>
		Modification.UtcDateTime;

	#endregion

	#region FakeTimeProvider Factory Methods

	/// <summary>
	/// Creates a FakeTimeProvider set to <see cref="Default"/>.
	/// </summary>
	/// <returns>
	/// A FakeTimeProvider initialized to 2025-01-15 12:00:00 UTC.
	/// </returns>
	public static FakeTimeProvider CreateDefaultTimeProvider() =>
		new(Default);

	/// <summary>
	/// Creates a FakeTimeProvider set to <see cref="Historical"/>.
	/// </summary>
	/// <returns>
	/// A FakeTimeProvider initialized to 2024-01-15 10:30:00 UTC.
	/// </returns>
	public static FakeTimeProvider CreateHistoricalTimeProvider() =>
		new(Historical);

	/// <summary>
	/// Creates a FakeTimeProvider set to <see cref="Future"/>.
	/// </summary>
	/// <returns>
	/// A FakeTimeProvider initialized to 2026-01-15 12:00:00 UTC.
	/// </returns>
	public static FakeTimeProvider CreateFutureTimeProvider() =>
		new(Future);

	#endregion

	#region Relative Date Helpers

	/// <summary>
	/// Gets a date relative to <see cref="Default"/> by days.
	/// </summary>
	/// <param name="days">
	/// Days to add (negative for past dates).
	/// </param>
	/// <returns>
	/// A DateTimeOffset offset from the default date.
	/// </returns>
	public static DateTimeOffset DaysFromDefault(int days) =>
		Default.AddDays(days);

	/// <summary>
	/// Gets a date relative to <see cref="Default"/> by hours.
	/// </summary>
	/// <param name="hours">
	/// Hours to add (negative for past times).
	/// </param>
	/// <returns>
	/// A DateTimeOffset offset from the default date.
	/// </returns>
	public static DateTimeOffset HoursFromDefault(int hours) =>
		Default.AddHours(hours);

	#endregion
}