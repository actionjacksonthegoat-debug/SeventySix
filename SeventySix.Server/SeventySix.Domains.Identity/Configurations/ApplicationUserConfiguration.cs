// <copyright file="ApplicationUserConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SeventySix.Shared.Constants;

namespace SeventySix.Identity;

/// <summary>
/// EF Core configuration for <see cref="ApplicationUser"/> entity.
/// </summary>
public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
	/// <summary>
	/// Configures the <see cref="ApplicationUser"/> mapping.
	/// </summary>
	/// <param name="builder">
	/// The EF Core entity type builder.
	/// </param>
	public void Configure(EntityTypeBuilder<ApplicationUser> builder)
	{
		builder
			.Property(user => user.FullName)
			.HasMaxLength(ValidationConstants.DisplayNameMaxLength);

		builder
			.Property(user => user.CreatedBy)
			.HasMaxLength(ValidationConstants.UsernameMaxLength)
			.IsRequired();

		builder
			.Property(user => user.ModifiedBy)
			.HasMaxLength(ValidationConstants.UsernameMaxLength);

		builder
			.Property(user => user.DeletedBy)
			.HasMaxLength(ValidationConstants.UsernameMaxLength);

		builder
			.Property(user => user.LastLoginIp)
			.HasMaxLength(ValidationConstants.IpAddressMaxLength);

		builder
			.Property(user => user.RequiresPasswordChange)
			.HasColumnType("boolean")
			.HasDefaultValue(false)
			.IsRequired();

		builder
			.Property(user => user.MfaEnabled)
			.HasColumnType("boolean")
			.HasDefaultValue(true)
			.IsRequired();

		// TOTP fields
		builder
			.Property(user => user.TotpSecret)
			.HasMaxLength(ValidationConstants.EncryptedTotpSecretMaxLength)
			.IsRequired(false);

		builder
			.Property(user => user.TotpEnrolledAt)
			.IsRequired(false);

		builder
			.Property(user => user.RowVersion)
			.IsRowVersion()
			.HasColumnName("xmin")
			.HasColumnType("xid");

		builder
			.HasIndex(user => user.Email)
			.IsUnique();

		builder
			.HasIndex(user => user.IsDeleted);
	}
}