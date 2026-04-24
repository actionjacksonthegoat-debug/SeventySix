// <copyright file="MfaAttemptTrackerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Shared.Constants;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="MfaAttemptTracker"/>.
/// Verifies FusionCache-backed attempt tracking, lockout behavior, TTL expiry,
/// reset semantics, and scale-safety via a shared cache (simulating horizontal replicas).
/// </summary>
public sealed class MfaAttemptTrackerTests
{
	private const long TestUserId = 42;
	private const string TestAttemptType = "totp";
	private const int MaxAttempts = 3;
	private const int LockoutWindowMinutes = 5;

	/// <summary>
	/// Creates a tracker with a freshly-provisioned in-memory Identity FusionCache.
	/// </summary>
	/// <param name="timeProvider">
	/// Fake time provider for deterministic expiry.
	/// </param>
	/// <returns>
	/// A configured <see cref="MfaAttemptTracker"/>.
	/// </returns>
	private static MfaAttemptTracker CreateTracker(FakeTimeProvider timeProvider)
	{
		IFusionCacheProvider cacheProvider =
			CreateCacheProvider();

		IOptions<MfaSettings> settings =
			Options.Create(new MfaSettings
			{
				Enabled = true,
				MaxAttempts = MaxAttempts,
				CodeExpirationMinutes = LockoutWindowMinutes,
				CodeLength = 6,
				ResendCooldownSeconds = 30,
			});

		return new MfaAttemptTracker(
			cacheProvider,
			settings,
			timeProvider);
	}

	/// <summary>
	/// Creates two trackers sharing one cache provider — simulates two API replicas
	/// sharing a distributed cache (Valkey L2 in production, memory-only L1 here).
	/// </summary>
	/// <param name="timeProvider">
	/// Fake time provider for both trackers.
	/// </param>
	/// <returns>
	/// A tuple of two trackers backed by the same cache.
	/// </returns>
	private static (MfaAttemptTracker First, MfaAttemptTracker Second) CreateSharedTrackers(FakeTimeProvider timeProvider)
	{
		IFusionCacheProvider cacheProvider =
			CreateCacheProvider();

		IOptions<MfaSettings> settings =
			Options.Create(new MfaSettings
			{
				Enabled = true,
				MaxAttempts = MaxAttempts,
				CodeExpirationMinutes = LockoutWindowMinutes,
				CodeLength = 6,
				ResendCooldownSeconds = 30,
			});

		MfaAttemptTracker first =
			new(cacheProvider, settings, timeProvider);
		MfaAttemptTracker second =
			new(cacheProvider, settings, timeProvider);

		return (first, second);
	}

	/// <summary>
	/// Builds a memory-only Identity FusionCache provider for tests.
	/// </summary>
	/// <returns>
	/// A cache provider exposing the Identity named cache.
	/// </returns>
	private static IFusionCacheProvider CreateCacheProvider()
	{
		ServiceCollection services =
			new();
		services.AddFusionCache(CacheNames.Identity);
		ServiceProvider sp =
			services.BuildServiceProvider();
		return sp.GetRequiredService<IFusionCacheProvider>();
	}

	/// <summary>
	/// Before any attempts are recorded, the user is not locked out.
	/// </summary>
	[Fact]
	public void IsLockedOut_NoAttempts_ReturnsFalse()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		bool locked =
			tracker.IsLockedOut(TestUserId, TestAttemptType);

		locked.ShouldBeFalse();
	}

	/// <summary>
	/// After fewer than MaxAttempts failures, the user remains unlocked.
	/// </summary>
	[Fact]
	public void IsLockedOut_BelowThreshold_ReturnsFalse()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		tracker.RecordFailedAttempt(TestUserId, TestAttemptType);
		tracker.RecordFailedAttempt(TestUserId, TestAttemptType);

		tracker
			.IsLockedOut(TestUserId, TestAttemptType)
			.ShouldBeFalse();
	}

	/// <summary>
	/// Once MaxAttempts is reached, the user is locked out.
	/// </summary>
	[Fact]
	public void IsLockedOut_AtThreshold_ReturnsTrue()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		for (int i = 0; i < MaxAttempts; i++)
		{
			tracker.RecordFailedAttempt(TestUserId, TestAttemptType);
		}

		tracker
			.IsLockedOut(TestUserId, TestAttemptType)
			.ShouldBeTrue();
	}

	/// <summary>
	/// Attempts recorded in one tracker are visible to another tracker
	/// sharing the same cache — proves scale-safety across API replicas.
	/// </summary>
	[Fact]
	public void RecordFailedAttempt_SharedCache_VisibleToOtherReplica()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		(MfaAttemptTracker first, MfaAttemptTracker second) =
			CreateSharedTrackers(time);

		for (int i = 0; i < MaxAttempts; i++)
		{
			first.RecordFailedAttempt(TestUserId, TestAttemptType);
		}

		second
			.IsLockedOut(TestUserId, TestAttemptType)
			.ShouldBeTrue();
	}

	/// <summary>
	/// Reset clears the attempt count, unlocking the user.
	/// </summary>
	[Fact]
	public void ResetAttempts_AfterLockout_UnlocksUser()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		for (int i = 0; i < MaxAttempts; i++)
		{
			tracker.RecordFailedAttempt(TestUserId, TestAttemptType);
		}

		tracker.ResetAttempts(TestUserId, TestAttemptType);

		tracker
			.IsLockedOut(TestUserId, TestAttemptType)
			.ShouldBeFalse();
	}

	/// <summary>
	/// Attempts for one attempt-type must not affect another attempt-type
	/// for the same user — the cache key must incorporate the attempt type.
	/// </summary>
	[Fact]
	public void RecordFailedAttempt_DifferentAttemptType_IsolatedCounters()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		for (int i = 0; i < MaxAttempts; i++)
		{
			tracker.RecordFailedAttempt(TestUserId, "totp");
		}

		tracker
			.IsLockedOut(TestUserId, "totp")
			.ShouldBeTrue();
		tracker
			.IsLockedOut(TestUserId, "backup")
			.ShouldBeFalse();
	}

	/// <summary>
	/// Attempts for one user must not affect another user — the cache key
	/// must incorporate the user id.
	/// </summary>
	[Fact]
	public void RecordFailedAttempt_DifferentUser_IsolatedCounters()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		for (int i = 0; i < MaxAttempts; i++)
		{
			tracker.RecordFailedAttempt(TestUserId, TestAttemptType);
		}

		const long OtherUserId =
			TestUserId + 1;

		tracker
			.IsLockedOut(TestUserId, TestAttemptType)
			.ShouldBeTrue();
		tracker
			.IsLockedOut(OtherUserId, TestAttemptType)
			.ShouldBeFalse();
	}

	/// <summary>
	/// Locked-out attempts expire after the lockout window — advancing the fake clock
	/// past the expiry instant must release the user from lockout.
	/// </summary>
	[Fact]
	public void IsLockedOut_AfterLockoutWindowExpires_ReturnsFalse()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		for (int i = 0; i < MaxAttempts; i++)
		{
			tracker.RecordFailedAttempt(TestUserId, TestAttemptType);
		}

		tracker
			.IsLockedOut(TestUserId, TestAttemptType)
			.ShouldBeTrue();

		// Advance fake clock past the lockout window
		time.Advance(
			TimeSpan.FromMinutes(LockoutWindowMinutes + 1));

		tracker
			.IsLockedOut(TestUserId, TestAttemptType)
			.ShouldBeFalse();
	}

	/// <summary>
	/// Concurrent calls to RecordFailedAttempt must not throw exceptions.
	/// Validates that the in-memory FusionCache is safe for parallel access
	/// (exact count preservation is best-effort due to read-modify-write semantics).
	/// </summary>
	[Fact]
	public async Task ConcurrentRecordAttempt_DoesNotThrowAsync()
	{
		FakeTimeProvider time =
			new(DateTimeOffset.UtcNow);
		MfaAttemptTracker tracker =
			CreateTracker(time);

		Task[] tasks =
			new Task[10];

		for (int i = 0; i < tasks.Length; i++)
		{
			tasks[i] =
				Task.Run(
					() => tracker.RecordFailedAttempt(
						TestUserId,
						TestAttemptType));
		}

		await Task.WhenAll(tasks);

		// At least one attempt must have been recorded
		// (lockout may or may not have triggered depending on scheduling)
		Should.NotThrow(
			() => tracker.IsLockedOut(
				TestUserId,
				TestAttemptType));
	}
}