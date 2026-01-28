// <copyright file="TestTimeProviderBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating TimeProvider mocks in tests.
/// Centralizes time mocking to avoid DRY violations across test files.
/// </summary>
/// <remarks>
/// Usage:
/// <code>
/// // Default (uses TestDates.Default)
/// TimeProvider timeProvider = TestTimeProviderBuilder.CreateDefault();
///
/// // Historical time
/// TimeProvider timeProvider = TestTimeProviderBuilder.CreateHistorical();
///
/// // Future time
/// TimeProvider timeProvider = TestTimeProviderBuilder.CreateFuture();
///
/// // Custom time
/// TimeProvider timeProvider = new TestTimeProviderBuilder()
///     .WithUtcNow(TestDates.Modification)
///     .Build();
/// </code>
/// </remarks>
public class TestTimeProviderBuilder
{
	/// <summary>
	/// Default fixed time for deterministic tests.
	/// References centralized <see cref="TestDates.Default"/> for consistency.
	/// </summary>
	public static readonly DateTimeOffset DefaultTime =
		TestDates.Default;

	private DateTimeOffset UtcNow = DefaultTime;

	/// <summary>
	/// Creates a TimeProvider mock with default fixed time.
	/// </summary>
	/// <returns>
	/// A TimeProvider mock returning <see cref="TestDates.Default"/>.
	/// </returns>
	public static TimeProvider CreateDefault() =>
		new TestTimeProviderBuilder().Build();

	/// <summary>
	/// Creates a TimeProvider mock with historical fixed time.
	/// </summary>
	/// <returns>
	/// A TimeProvider mock returning <see cref="TestDates.Historical"/>.
	/// </returns>
	public static TimeProvider CreateHistorical() =>
		new TestTimeProviderBuilder()
			.WithUtcNow(TestDates.Historical)
			.Build();

	/// <summary>
	/// Creates a TimeProvider mock with future fixed time.
	/// </summary>
	/// <returns>
	/// A TimeProvider mock returning <see cref="TestDates.Future"/>.
	/// </returns>
	public static TimeProvider CreateFuture() =>
		new TestTimeProviderBuilder()
			.WithUtcNow(TestDates.Future)
			.Build();

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
		new TestTimeProviderBuilder()
			.WithUtcNow(fixedTime)
			.Build();

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