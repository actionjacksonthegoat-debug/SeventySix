// <copyright file="EcommerceCleanupRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Npgsql;
using SeventySix.EcommerceCleanup.Repositories;
using Shouldly;
using Testcontainers.PostgreSql;

namespace SeventySix.Domains.Tests.EcommerceCleanup.Repositories;

/// <summary>
/// Integration tests for <see cref="EcommerceCleanupRepository"/>.
/// Uses Testcontainers to spin up a real PostgreSQL instance
/// with the Drizzle cart_sessions schema.
/// </summary>
public sealed class EcommerceCleanupRepositoryTests : IAsyncLifetime
{
	private readonly PostgreSqlContainer Container =
		new PostgreSqlBuilder("postgres:16-alpine")
			.WithDatabase("ecommerce_test")
			.WithUsername("test")
			.WithPassword("test_password")
			.WithCleanUp(true)
			.Build();

	private readonly EcommerceCleanupRepository Repository = new();

	/// <inheritdoc />
	public async Task InitializeAsync()
	{
		await Container.StartAsync();
		await CreateSchemaAsync();
	}

	/// <inheritdoc />
	public async Task DisposeAsync()
	{
		await Container.DisposeAsync();
	}

	/// <summary>
	/// Verifies that expired cart sessions are deleted.
	/// </summary>
	[Fact]
	public async Task DeleteExpiredCartSessionsAsync_DeletesExpiredSessions_ReturnsCountAsync()
	{
		// Arrange
		DateTimeOffset now =
			DateTimeOffset.UtcNow;
		DateTimeOffset cutoff =
			now.AddDays(-30);

		await InsertCartSessionAsync(
			Guid.NewGuid(),
			now.AddDays(-60));

		await InsertCartSessionAsync(
			Guid.NewGuid(),
			now.AddDays(-31));

		await InsertCartSessionAsync(
			Guid.NewGuid(),
			now.AddDays(-1));

		// Act
		int deletedCount =
			await Repository.DeleteExpiredCartSessionsAsync(
				Container.GetConnectionString(),
				cutoff,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(2);
		int remainingCount =
			await CountCartSessionsAsync();
		remainingCount.ShouldBe(1);
	}

	/// <summary>
	/// Verifies that no sessions are deleted when none are expired.
	/// </summary>
	[Fact]
	public async Task DeleteExpiredCartSessionsAsync_NoExpiredSessions_ReturnsZeroAsync()
	{
		// Arrange
		DateTimeOffset now =
			DateTimeOffset.UtcNow;

		await InsertCartSessionAsync(
			Guid.NewGuid(),
			now.AddDays(7));

		await InsertCartSessionAsync(
			Guid.NewGuid(),
			now.AddDays(14));

		// Act
		int deletedCount =
			await Repository.DeleteExpiredCartSessionsAsync(
				Container.GetConnectionString(),
				now,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(0);
	}

	/// <summary>
	/// Verifies that all sessions are deleted when all are expired.
	/// </summary>
	[Fact]
	public async Task DeleteExpiredCartSessionsAsync_AllExpired_DeletesAllAsync()
	{
		// Arrange
		DateTimeOffset now =
			DateTimeOffset.UtcNow;

		await InsertCartSessionAsync(
			Guid.NewGuid(),
			now.AddDays(-10));

		await InsertCartSessionAsync(
			Guid.NewGuid(),
			now.AddDays(-5));

		// Act
		int deletedCount =
			await Repository.DeleteExpiredCartSessionsAsync(
				Container.GetConnectionString(),
				now,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(2);
	}

	/// <summary>
	/// Verifies that empty table returns zero.
	/// </summary>
	[Fact]
	public async Task DeleteExpiredCartSessionsAsync_EmptyTable_ReturnsZeroAsync()
	{
		// Act
		int deletedCount =
			await Repository.DeleteExpiredCartSessionsAsync(
				Container.GetConnectionString(),
				DateTimeOffset.UtcNow,
				CancellationToken.None);

		// Assert
		deletedCount.ShouldBe(0);
	}

	private async Task CreateSchemaAsync()
	{
		await using NpgsqlConnection connection =
			new(Container.GetConnectionString());
		await connection.OpenAsync();

		await using NpgsqlCommand command =
			new(
				"""
				CREATE TABLE "cart_sessions" (
					"id" uuid PRIMARY KEY NOT NULL,
					"created_at" timestamp with time zone DEFAULT now() NOT NULL,
					"expires_at" timestamp with time zone NOT NULL
				);
				""",
				connection);

		await command.ExecuteNonQueryAsync();
	}

	private async Task InsertCartSessionAsync(
		Guid id,
		DateTimeOffset expiresAt)
	{
		await using NpgsqlConnection connection =
			new(Container.GetConnectionString());
		await connection.OpenAsync();

		await using NpgsqlCommand command =
			new(
				"INSERT INTO cart_sessions (id, expires_at) VALUES (@id, @expiresAt)",
				connection);

		command.Parameters.AddWithValue("@id", id);
		command.Parameters.AddWithValue("@expiresAt", expiresAt);
		await command.ExecuteNonQueryAsync();
	}

	private async Task<int> CountCartSessionsAsync()
	{
		await using NpgsqlConnection connection =
			new(Container.GetConnectionString());
		await connection.OpenAsync();

		await using NpgsqlCommand command =
			new(
				"SELECT COUNT(*) FROM cart_sessions",
				connection);

		object? result =
			await command.ExecuteScalarAsync();

		return Convert.ToInt32(result);
	}
}