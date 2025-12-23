// <copyright file="CacheInvalidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.OutputCaching;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Extension methods for output cache invalidation.
/// </summary>
/// <remarks>
/// Provides convenient methods to invalidate cache by tag.
/// Simplifies cache invalidation in controllers after mutations.
/// </remarks>
public static class CacheInvalidationExtensions
{
	/// <summary>
	/// Invalidates all cache entries with the specified tag.
	/// </summary>
	/// <param name="services">
	/// The service provider.
	/// </param>
	/// <param name="tag">
	/// The cache tag to invalidate.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	/// <exception cref="ArgumentNullException">Thrown when services or tag is null.</exception>
	public static async Task InvalidateCacheByTagAsync(
		this IServiceProvider services,
		string tag,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(services);
		ArgumentNullException.ThrowIfNull(tag);

		IOutputCacheStore cache =
			services.GetRequiredService<IOutputCacheStore>();
		await cache.EvictByTagAsync(tag, cancellationToken);
	}

	/// <summary>
	/// Invalidates cache entries for multiple tags.
	/// </summary>
	/// <param name="services">
	/// The service provider.
	/// </param>
	/// <param name="tags">
	/// Array of cache tags to invalidate.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	/// <exception cref="ArgumentNullException">Thrown when services or tags is null.</exception>
	public static async Task InvalidateMultipleTagsAsync(
		this IServiceProvider services,
		string[] tags,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(services);
		ArgumentNullException.ThrowIfNull(tags);

		IOutputCacheStore cache =
			services.GetRequiredService<IOutputCacheStore>();

		foreach (string tag in tags)
		{
			await cache.EvictByTagAsync(tag, cancellationToken);
		}
	}
}