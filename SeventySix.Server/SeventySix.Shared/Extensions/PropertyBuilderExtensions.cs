// <copyright file="PropertyBuilderExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Extension methods for EF Core PropertyBuilder configuration.
/// Reduces duplication in entity configurations.
/// </summary>
public static class PropertyBuilderExtensions
{
	/// <summary>
	/// Configures a CreateDate property with standard settings.
	/// </summary>
	/// <param name="builder">
	/// The property builder.
	/// </param>
	/// <returns>
	/// The property builder for chaining.
	/// </returns>
	public static PropertyBuilder<DateTimeOffset> ConfigureAsCreateDate(
		this PropertyBuilder<DateTimeOffset> builder) =>
		builder
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

	/// <summary>
	/// Configures a nullable timestamp property.
	/// </summary>
	/// <param name="builder">
	/// The property builder.
	/// </param>
	/// <returns>
	/// The property builder for chaining.
	/// </returns>
	public static PropertyBuilder<DateTimeOffset?> ConfigureAsNullableTimestamp(
		this PropertyBuilder<DateTimeOffset?> builder) =>
		builder
			.IsRequired(false)
			.HasColumnType("timestamp with time zone");
}