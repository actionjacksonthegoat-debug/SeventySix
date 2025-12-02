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
/// - Composite unique index on (UserId, Role) prevents duplicate role assignments
/// - Role is a simple string (KISS - no complex permission hierarchy)
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
		builder.Property(userRole => userRole.Id)
			.UseIdentityColumn()
			.IsRequired();

		// UserId - Required
		builder.Property(userRole => userRole.UserId)
			.IsRequired();

		// Role - Required, e.g., "User", "Admin", "Developer"
		builder.Property(userRole => userRole.Role)
			.IsRequired()
			.HasMaxLength(50);

		// Composite unique index - each user can only have each role once
		builder.HasIndex(userRole => new { userRole.UserId, userRole.Role })
			.IsUnique()
			.HasDatabaseName("IX_UserRoles_UserId_Role");

		// Index for querying users by role
		builder.HasIndex(userRole => userRole.Role)
			.HasDatabaseName("IX_UserRoles_Role");

		// Audit properties - nullable for whitelisted auto-approvals
		builder.Property(userRole => userRole.CreateDate)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		builder.Property(userRole => userRole.ModifyDate)
			.IsRequired(false)
			.HasColumnType("timestamp with time zone");

		builder.Property(userRole => userRole.CreatedBy)
			.HasMaxLength(256)
			.IsRequired(false);

		builder.Property(userRole => userRole.ModifiedBy)
			.HasMaxLength(256)
			.IsRequired(false);

		// FK relationship to User - cascade delete roles when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(userRole => userRole.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}