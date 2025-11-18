// <copyright file="CompressResponseAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IO.Compression;

namespace SeventySix.Api.Attributes;

/// <summary>
/// Attribute to configure response compression for a controller or action.
/// </summary>
/// <remarks>
/// Controls whether responses should be compressed and at what level.
/// Compression is enabled by default globally, but this attribute allows
/// fine-grained control per endpoint.
///
/// <para>Examples:</para>
/// <code>
/// // Disable compression for file downloads
/// [CompressResponse(Enabled = false)]
/// public async Task&lt;IActionResult&gt; DownloadFile() { }
///
/// // Use optimal compression for API responses
/// [CompressResponse(Level = CompressionLevel.Optimal)]
/// public async Task&lt;IActionResult&gt; GetLargeDataset() { }
/// </code>
/// </remarks>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class CompressResponseAttribute : Attribute
{
	/// <summary>
	/// Gets or sets a value indicating whether compression is enabled.
	/// </summary>
	/// <value>Default: true.</value>
	public bool Enabled { get; set; } = true;

	/// <summary>
	/// Gets or sets the compression level.
	/// </summary>
	/// <value>Default: Fastest for better performance.</value>
	public CompressionLevel Level { get; set; } = CompressionLevel.Fastest;

	/// <summary>
	/// Gets or sets the minimum response size (in bytes) to trigger compression.
	/// Responses smaller than this will not be compressed.
	/// </summary>
	/// <value>Default: 1024 bytes (1 KB).</value>
	public int MinimumSizeBytes { get; set; } = 1024;

	/// <summary>
	/// Initializes a new instance of the <see cref="CompressResponseAttribute"/> class.
	/// </summary>
	public CompressResponseAttribute()
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="CompressResponseAttribute"/> class.
	/// </summary>
	/// <param name="enabled">Whether compression is enabled.</param>
	public CompressResponseAttribute(bool enabled) => Enabled = enabled;
}