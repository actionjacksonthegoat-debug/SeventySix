// <copyright file="TimeProviderExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Shared.Tests.Extensions;

/// <summary>
/// Unit tests for <see cref="TimeProviderExtensions"/>.
/// </summary>
public sealed class TimeProviderExtensionsTests
{
	/// <summary>
	/// GetCurrentUtc delegates to GetUtcNow() of the underlying time provider.
	/// </summary>
	[Fact]
	public void GetCurrentUtc_WithFakeTimeProvider_ReturnsFakeTime()
	{
		FakeTimeProvider timeProvider =
			new(TestDates.Future);

		DateTimeOffset result =
			timeProvider.GetCurrentUtc();

		result.ShouldBe(TestDates.Future);
	}
}