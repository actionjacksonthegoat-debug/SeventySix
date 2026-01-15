// <copyright file="ICacheable.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>
/// Marker interface for types that can be cached via FusionCache.
/// </summary>
/// <remarks>
/// All implementations must be annotated with [MemoryPackable] for serialization.
/// This interface provides a compile-time contract for cacheable types.
/// </remarks>
public interface ICacheable
{
}
