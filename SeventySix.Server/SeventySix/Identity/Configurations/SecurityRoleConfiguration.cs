// <copyright file="SecurityRoleConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="SecurityRole"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Unique constraint on Name ensures role names are not duplicated
/// - IsActive allows disabling roles without deletion (preserves FK integrity)
/// - Seeds standard roles: User, Developer, Admin
/// </remarks>
public class SecurityRoleConfiguration : IEntityTypeConfiguration<SecurityRole>
{
	/// <summary>
	/// Configures the entity mapping for SecurityRole.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<SecurityRole> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("SecurityRoles");

		builder.HasKey(role => role.Id);

		builder
			.Property(role => role.Id)
			.UseIdentityColumn()
			.IsRequired();

		// Name - Required, unique
		builder
			.Property(role => role.Name)
			.IsRequired()
			.HasMaxLength(50);

		builder
			.HasIndex(role => role.Name)
			.IsUnique()
			.HasDatabaseName("IX_SecurityRoles_Name");

		// Description - Optional
		builder
			.Property(role => role.Description)
			.HasMaxLength(256);

		// IsActive - Required, defaults to true
		builder
			.Property(role => role.IsActive)
			.IsRequired()
			.HasDefaultValue(true);

		// CreateDate - Required, auto-populated
		builder
			.Property(role => role.CreateDate)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// Seed standard roles
		builder.HasData(
			new SecurityRole
			{
				Id = 1,
				Name = "User",
				Description = "Standard user access",
				IsActive = true,
				CreateDate = new DateTime(
					2025,
					1,
					1,
					0,
					0,
					0,
					DateTimeKind.Utc),
			},
			new SecurityRole
			{
				Id = 2,
				Name = "Developer",
				Description = "Access to developer tools and APIs",
				IsActive = true,
				CreateDate = new DateTime(
					2025,
					1,
					1,
					0,
					0,
					0,
					DateTimeKind.Utc),
			},
			new SecurityRole
			{
				Id = 3,
				Name = "Admin",
				Description = "Full administrative access",
				IsActive = true,
				CreateDate = new DateTime(
					2025,
					1,
					1,
					0,
					0,
					0,
					DateTimeKind.Utc),
			});
	}
}