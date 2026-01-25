// <copyright file="TrustedDeviceConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="TrustedDevice"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Token is hashed (SHA256 = 64 chars hex)
/// - Device fingerprint is hashed (SHA256 = 64 chars hex)
/// - Unique index on TokenHash for fast lookups
/// - Index on UserId for listing user's devices
/// </remarks>
public class TrustedDeviceConfiguration : IEntityTypeConfiguration<TrustedDevice>
{
	/// <summary>
	/// Configures the entity mapping for TrustedDevice.
	/// </summary>
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<TrustedDevice> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("TrustedDevices");

		builder.HasKey(device => device.Id);
		builder
			.Property(device => device.Id)
			.UseIdentityColumn()
			.IsRequired();

		// UserId - Required
		builder
			.Property(device => device.UserId)
			.IsRequired();

		// TokenHash - Required, SHA256 hex = 64 chars
		builder
			.Property(device => device.TokenHash)
			.IsRequired()
			.HasMaxLength(64);
		builder
			.HasIndex(device => device.TokenHash)
			.IsUnique()
			.HasDatabaseName("IX_TrustedDevices_TokenHash");

		// DeviceFingerprint - Required, SHA256 hex = 64 chars
		builder
			.Property(device => device.DeviceFingerprint)
			.IsRequired()
			.HasMaxLength(64);

		// DeviceName - Optional, for user display
		builder
			.Property(device => device.DeviceName)
			.HasMaxLength(100)
			.IsRequired(false);

		// ExpiresAt - Required
		builder
			.Property(device => device.ExpiresAt)
			.IsRequired();

		// LastUsedAt - Optional
		builder
			.Property(device => device.LastUsedAt)
			.IsRequired(false);

		// Audit fields
		builder
			.Property(device => device.CreateDate)
			.IsRequired();

		builder
			.Property(device => device.CreatedBy)
			.IsRequired()
			.HasMaxLength(100);

		builder
			.Property(device => device.ModifyDate)
			.IsRequired(false);

		builder
			.Property(device => device.ModifiedBy)
			.HasMaxLength(100)
			.IsRequired(false);

		// Index for finding user's devices
		builder
			.HasIndex(device => device.UserId)
			.HasDatabaseName("IX_TrustedDevices_UserId");

		// Relationship to User
		builder
			.HasOne(device => device.User)
			.WithMany()
			.HasForeignKey(device => device.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}