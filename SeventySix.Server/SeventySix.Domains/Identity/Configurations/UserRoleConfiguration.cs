// <copyright file="UserRoleConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="UserRole"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Composite unique index on (UserId, RoleId) prevents duplicate role assignments
/// - RoleId FK to SecurityRoles with RESTRICT delete (cannot delete role if assigned)
/// - Implements IAuditableEntity for audit tracking.
/// </remarks>
public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
	/// <summary>
	/// Configures the entity mapping for UserRole.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<UserRole> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("UserRoles");

		builder.HasKey(userRole => userRole.Id);
		builder
			.Property(userRole => userRole.Id)
			.UseIdentityColumn()
			.IsRequired();

		// UserId - Required
		builder.Property(userRole => userRole.UserId).IsRequired();

		// RoleId - Required, FK to SecurityRoles
		builder.Property(userRole => userRole.RoleId).IsRequired();

		// Composite unique index - each user can only have each role once
		builder
			.HasIndex(userRole => new { userRole.UserId, userRole.RoleId })
			.IsUnique()
			.HasDatabaseName("IX_UserRoles_UserId_RoleId");

		// Index for querying users by role
		builder
			.HasIndex(userRole => userRole.RoleId)
			.HasDatabaseName("IX_UserRoles_RoleId");

		// Audit properties - nullable for whitelisted auto-approvals
		builder
			.Property(userRole => userRole.CreateDate)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		builder
			.Property(userRole => userRole.ModifyDate)
			.IsRequired(false)
			.HasColumnType("timestamp with time zone");

		builder
			.Property(userRole => userRole.CreatedBy)
			.HasMaxLength(256)
			.IsRequired(false);

		builder
			.Property(userRole => userRole.ModifiedBy)
			.HasMaxLength(256)
			.IsRequired(false);

		// FK relationship to User - cascade delete roles when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(userRole => userRole.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		// FK relationship to SecurityRole - RESTRICT prevents deleting role if assigned
		builder
			.HasOne(userRole => userRole.Role)
			.WithMany()
			.HasForeignKey(userRole => userRole.RoleId)
			.OnDelete(DeleteBehavior.Restrict);
	}
}