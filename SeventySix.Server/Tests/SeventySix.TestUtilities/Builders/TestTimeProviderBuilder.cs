// <copyright file="TestTimeProviderBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating TimeProvider mocks in tests.
/// Centralizes time mocking to avoid DRY violations across test files.
/// </summary>
/// <remarks>
/// Usage:
/// <code>
/// // Default (2025-01-01 12:00:00 UTC)
/// TimeProvider timeProvider = TestTimeProviderBuilder.CreateDefault();
///
/// // Custom time
/// TimeProvider timeProvider = new TestTimeProviderBuilder()
///     .WithUtcNow(new DateTimeOffset(2025, 6, 15, 14, 30, 0, TimeSpan.Zero))
///     .Build();
/// </code>
/// </remarks>
public class TestTimeProviderBuilder
{
	/// <summary>
	/// Default fixed time for deterministic tests.
	/// </summary>
	public static readonly DateTimeOffset DefaultTime =
		new(
		2025,
		1,
		1,
		12,
		0,
		0,
		TimeSpan.Zero);

	private DateTimeOffset UtcNow = DefaultTime;

	/// <summary>
	/// Creates a TimeProvider mock with default fixed time.
	/// </summary>
	/// <returns>
	/// A TimeProvider mock returning 2025-01-01 12:00:00 UTC.
	/// </returns>
	public static TimeProvider CreateDefault() =>
		new TestTimeProviderBuilder().Build();

	/// <summary>
	/// Creates a TimeProvider mock for a specific fixed time.
	/// </summary>
	/// <param name="fixedTime">
	/// The fixed time to return.
	/// </param>
	/// <returns>
	/// A TimeProvider mock returning the specified time.
	/// </returns>
	public static TimeProvider Create(DateTimeOffset fixedTime) =>
		new TestTimeProviderBuilder().WithUtcNow(fixedTime).Build();

	/// <summary>
	/// Sets the UTC time the mock will return.
	/// </summary>
	/// <param name="time">
	/// The fixed time to return from GetUtcNow().
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public TestTimeProviderBuilder WithUtcNow(DateTimeOffset time)
	{
		UtcNow = time;
		return this;
	}

	/// <summary>
	/// Builds the TimeProvider mock.
	/// </summary>
	/// <returns>
	/// A configured TimeProvider mock.
	/// </returns>
	public TimeProvider Build()
	{
		TimeProvider mock =
			Substitute.For<TimeProvider>();
		mock.GetUtcNow().Returns(UtcNow);
		return mock;
	}
}