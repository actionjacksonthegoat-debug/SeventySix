// <copyright file="LoggingMockFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Logging;
using SeventySix.Shared.POCOs;

namespace SeventySix.TestUtilities.Mocks;

/// <summary>
/// Factory for creating Logging-related mock objects.
/// Centralizes mock creation to ensure consistency and reduce duplication.
/// </summary>
public static class LoggingMockFactory
{
	/// <summary>
	/// Creates a mock <see cref="ILogRepository"/> with default empty returns.
	/// </summary>
	/// <returns>
	/// A configured NSubstitute mock for ILogRepository.
	/// </returns>
	public static ILogRepository CreateLogRepository()
	{
		ILogRepository repository =
			Substitute.For<ILogRepository>();

		// Default: return empty paged result
		repository
			.GetPagedAsync(
				Arg.Any<LogQueryRequest>(),
				Arg.Any<CancellationToken>())
			.Returns((Enumerable.Empty<Log>(), 0));

		// Default: return 0 deleted records
		repository
			.DeleteOlderThanAsync(
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>())
			.Returns(0);

		// Default: return true for delete by ID
		repository
			.DeleteByIdAsync(
				Arg.Any<long>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		return repository;
	}
}