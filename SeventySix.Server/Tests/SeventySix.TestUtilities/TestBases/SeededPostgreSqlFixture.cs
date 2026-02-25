// <copyright file="SeededPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Fixture that seeds data once and is shared across read-only tests.
/// </summary>
/// <remarks>
/// This fixture enables a "seed once, query many" pattern for tests that:
/// - Only READ data (never modify)
/// - Can share seed data across tests
/// - Benefit from avoiding per-test truncation
///
/// The seed action is called exactly once, thread-safely, on first access.
/// All subsequent tests reuse the seeded data.
/// </remarks>
public sealed class SeededPostgreSqlFixture : BasePostgreSqlFixture
{
	private readonly SemaphoreSlim SeedLock =
		new(1, 1);
	private readonly ConcurrentDictionary<Type, object> CachedFactories = new();
	private string? ConnectionStringValue;
	private bool IsSeeded;

	/// <inheritdoc/>
	public override string ConnectionString =>
		ConnectionStringValue
		?? throw new InvalidOperationException(
			"Fixture not initialized. Call InitializeAsync first.");

	/// <inheritdoc/>
	public override SharedWebApplicationFactory<TProgram> GetOrCreateFactory<TProgram>()
	{
		return (SharedWebApplicationFactory<TProgram>)
			CachedFactories.GetOrAdd(
				typeof(TProgram),
				_ => new SharedWebApplicationFactory<TProgram>(ConnectionString));
	}

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		ConnectionStringValue =
			await SharedContainerManager.GetOrCreateContainerAsync();
	}

	/// <inheritdoc/>
	public override async Task DisposeAsync()
	{
		foreach (IDisposable disposable in CachedFactories.Values.OfType<IDisposable>())
		{
			disposable.Dispose();
		}

		CachedFactories.Clear();
		SeedLock.Dispose();
		await Task.CompletedTask;
	}

	/// <summary>
	/// Seeds the database once with test data.
	/// Thread-safe - only seeds on first call.
	/// </summary>
	/// <param name="seedAction">
	/// The async action that seeds the database.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public async Task EnsureSeededAsync(Func<Task> seedAction)
	{
		await SeedLock.WaitAsync();
		try
		{
			if (IsSeeded)
			{
				return;
			}

			await seedAction();
			IsSeeded = true;
		}
		finally
		{
			SeedLock.Release();
		}
	}
}