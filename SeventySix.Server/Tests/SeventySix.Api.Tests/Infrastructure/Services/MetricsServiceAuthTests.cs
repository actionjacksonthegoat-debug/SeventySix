// <copyright file="MetricsServiceAuthTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.Metrics;
using SeventySix.Api.Infrastructure;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Tests for auth-related counters in <see cref="MetricsService"/>.
/// Uses <see cref="MeterListener"/> to capture counter increments without an OTel exporter.
/// </summary>
public sealed class MetricsServiceAuthTests : IDisposable
{
	private readonly MetricsService Service =
		new();
	private readonly MeterListener Listener =
		new();
	private readonly List<(string Name, long Value, KeyValuePair<string, object?>[] Tags)> Measurements;

	/// <summary>
	/// Initializes the <see cref="MeterListener"/> to capture measurements from the SeventySix.Api meter.
	/// </summary>
	public MetricsServiceAuthTests()
	{
		Measurements =
			new List<(string Name, long Value, KeyValuePair<string, object?>[] Tags)>();
		Listener.InstrumentPublished =
			(instrument, listener) =>
		{
			if (instrument.Meter.Name == "SeventySix.Api")
			{
				listener.EnableMeasurementEvents(instrument);
			}
		};

		Listener.SetMeasurementEventCallback<long>(
			(instrument, measurement, tags, _) =>
			{
				Measurements.Add(
					(instrument.Name, measurement, tags.ToArray()));
			});

		Listener.Start();
	}

	/// <summary>
	/// Disposes the <see cref="MeterListener"/>.
	/// </summary>
	public void Dispose()
	{
		Listener.Dispose();
	}

	[Fact]
	public void RecordLoginSuccess_IncrementsCounterExactlyOnce()
	{
		Measurements.Clear();

		Service.RecordLoginSuccess();

		Listener.RecordObservableInstruments();
		List<(string Name, long Value, KeyValuePair<string, object?>[] Tags)> loginSuccessEvents =
			Measurements
				.Where(m => m.Name == "auth.login.success")
				.ToList();

		loginSuccessEvents.Count.ShouldBe(1);
		loginSuccessEvents[0].Value.ShouldBe(1);
	}

	[Theory]
	[InlineData(
		"invalid_credentials")]
	[InlineData(
		"account_locked")]
	public void RecordLoginFailure_IncrementsCounterWithReason(string reason)
	{
		Measurements.Clear();

		Service.RecordLoginFailure(reason);

		Listener.RecordObservableInstruments();
		List<(string Name, long Value, KeyValuePair<string, object?>[] Tags)> failureEvents =
			Measurements
				.Where(m => m.Name == "auth.login.failure")
				.ToList();

		failureEvents.Count.ShouldBe(1);
		failureEvents[0].Value.ShouldBe(1);
		failureEvents[0]
			.Tags
			.ShouldContain(
				t => t.Key == "reason" && (string)t.Value! == reason);
	}

	[Theory]
	[InlineData(
		"code_mismatch")]
	[InlineData(
		"expired")]
	public void RecordMfaVerifyFailure_IncrementsCounterWithReason(string reason)
	{
		Measurements.Clear();

		Service.RecordMfaVerifyFailure(reason);

		Listener.RecordObservableInstruments();
		List<(string Name, long Value, KeyValuePair<string, object?>[] Tags)> mfaEvents =
			Measurements
				.Where(m => m.Name == "auth.mfa.verify.failure")
				.ToList();

		mfaEvents.Count.ShouldBe(1);
		mfaEvents[0].Value.ShouldBe(1);
		mfaEvents[0]
			.Tags
			.ShouldContain(
				t => t.Key == "reason" && (string)t.Value! == reason);
	}

	[Fact]
	public void RecordLoginFailure_MultipleCalls_AllRecorded()
	{
		Measurements.Clear();

		Service.RecordLoginFailure("invalid_credentials");
		Service.RecordLoginFailure("account_locked");
		Service.RecordLoginFailure("invalid_credentials");

		Listener.RecordObservableInstruments();
		List<(string Name, long Value, KeyValuePair<string, object?>[] Tags)> failureEvents =
			Measurements
				.Where(m => m.Name == "auth.login.failure")
				.ToList();

		failureEvents.Count.ShouldBe(3);
	}
}
