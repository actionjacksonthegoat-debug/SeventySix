// <copyright file="OAuthProviderFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Resolves the correct OAuth strategy by provider name.
/// </summary>
/// <param name="strategies">
/// All registered OAuth provider strategies.
/// </param>
public sealed class OAuthProviderFactory(
	IEnumerable<IOAuthProviderStrategy> strategies)
{
	/// <summary>
	/// Map of provider name → strategy, case-insensitive.
	/// </summary>
	private readonly Dictionary<string, IOAuthProviderStrategy> StrategyMap =
		strategies.ToDictionary(
			strategy => strategy.ProviderName,
			strategy => strategy,
			StringComparer.OrdinalIgnoreCase);

	/// <summary>
	/// Gets the strategy for the given provider.
	/// </summary>
	/// <param name="provider">
	/// The provider name (e.g., "GitHub", "Google").
	/// </param>
	/// <returns>
	/// The strategy for the specified provider.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when the provider is not registered.
	/// </exception>
	public IOAuthProviderStrategy GetStrategy(string provider)
	{
		return StrategyMap.TryGetValue(
			provider,
			out IOAuthProviderStrategy? strategy)
				? strategy
				: throw new InvalidOperationException(
					$"OAuth provider '{provider}' is not configured.");
	}

	/// <summary>
	/// Gets all registered provider names.
	/// </summary>
	/// <returns>
	/// Read-only list of registered provider names.
	/// </returns>
	public IReadOnlyList<string> GetRegisteredProviders()
	{
		return StrategyMap.Keys.ToList().AsReadOnly();
	}
}
