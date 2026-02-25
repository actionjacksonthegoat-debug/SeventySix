// <copyright file="ApiTrackingMockFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.ApiTracking;

namespace SeventySix.TestUtilities.Mocks;

/// <summary>
/// Factory for creating ApiTracking-related mock objects.
/// Centralizes mock creation to ensure consistency and reduce duplication.
/// </summary>
public static class ApiTrackingMockFactory
{
	/// <summary>
	/// Creates a mock <see cref="IThirdPartyApiRequestRepository"/> with default empty returns.
	/// </summary>
	/// <returns>
	/// A configured NSubstitute mock for IThirdPartyApiRequestRepository.
	/// </returns>
	public static IThirdPartyApiRequestRepository CreateThirdPartyApiRequestRepository()
	{
		IThirdPartyApiRequestRepository repository =
			Substitute.For<IThirdPartyApiRequestRepository>();

		// Default: return null for GetByApiNameAndDate
		repository
			.GetByApiNameAndDateAsync(
				Arg.Any<string>(),
				Arg.Any<DateOnly>(),
				Arg.Any<CancellationToken>())
			.Returns(default(ThirdPartyApiRequest?));

		// Default: return empty list for GetByApiName
		repository
			.GetByApiNameAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns([]);

		// Default: return empty list for GetAll
		repository
			.GetAllAsync(
				Arg.Any<CancellationToken>())
			.Returns([]);

		return repository;
	}
}