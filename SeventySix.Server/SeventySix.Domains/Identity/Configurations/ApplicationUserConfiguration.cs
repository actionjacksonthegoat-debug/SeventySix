// <copyright file="ApplicationUserConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// EF Core configuration for <see cref="ApplicationUser"/> entity.
/// </summary>
public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
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
			.HasMaxLength(100);

		builder
			.Property(user => user.CreatedBy)
			.HasMaxLength(100)
			.IsRequired();

		builder
			.Property(user => user.ModifiedBy)
			.HasMaxLength(100);

		builder
			.Property(user => user.DeletedBy)
			.HasMaxLength(100);

		builder
			.Property(user => user.LastLoginIp)
			.HasMaxLength(45);
		// Flag to require password change on next login (default false)
		builder
			.Property(user => user.RequiresPasswordChange)
			.HasColumnType("boolean")
			.HasDefaultValue(false)
			.IsRequired();

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