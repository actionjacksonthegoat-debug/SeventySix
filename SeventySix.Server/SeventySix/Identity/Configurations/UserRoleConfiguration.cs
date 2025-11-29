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

		builder.HasKey(e => e.Id);
		builder.Property(e => e.Id)
			.UseIdentityColumn()
			.IsRequired();

		// UserId - Required
		builder.Property(e => e.UserId)
			.IsRequired();

		// Role - Required, e.g., "User", "Admin"
		builder.Property(e => e.Role)
			.IsRequired()
			.HasMaxLength(50);

		// Composite unique index - each user can only have each role once
		builder.HasIndex(e => new { e.UserId, e.Role })
			.IsUnique()
			.HasDatabaseName("IX_UserRoles_UserId_Role");

		// Index for querying users by role
		builder.HasIndex(e => e.Role)
			.HasDatabaseName("IX_UserRoles_Role");

		// AssignedAt - Required
		builder.Property(e => e.AssignedAt)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// FK relationship to User - cascade delete roles when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(userRole => userRole.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}