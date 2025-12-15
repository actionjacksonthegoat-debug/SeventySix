// <copyright file="PermissionRequestConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>EF Core configuration for <see cref="PermissionRequest"/> entity.</summary>
/// <remarks>
/// Design Principles:
/// - RequestedRoleId FK to SecurityRoles with RESTRICT delete
/// - Composite unique index prevents duplicate pending requests per user per role
/// </remarks>
public class PermissionRequestConfiguration
	: IEntityTypeConfiguration<PermissionRequest>
{
	/// <inheritdoc/>
	public void Configure(EntityTypeBuilder<PermissionRequest> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("PermissionRequests");
		builder.HasKey(request => request.Id);

		builder
			.Property(request => request.Id)
			.UseIdentityColumn()
			.IsRequired();

		builder.Property(request => request.UserId).IsRequired();

		builder.Property(request => request.RequestedRoleId).IsRequired();

		builder.Property(request => request.RequestMessage).HasMaxLength(500);

		builder
			.Property(request => request.CreatedBy)
			.IsRequired()
			.HasMaxLength(50);

		builder
			.Property(request => request.CreateDate)
			.IsRequired()
			.HasColumnType("timestamp with time zone");

		// Composite unique: one pending request per user per role
		builder
			.HasIndex(request => new
				{
					request.UserId,
					request.RequestedRoleId,
				})
			.IsUnique()
			.HasDatabaseName("IX_PermissionRequests_UserId_RoleId");

		// FK to User - cascade delete when user is deleted
		builder
			.HasOne(request => request.User)
			.WithMany()
			.HasForeignKey(request => request.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		// FK to SecurityRole - RESTRICT prevents deleting role with pending requests
		builder
			.HasOne(request => request.RequestedRole)
			.WithMany()
			.HasForeignKey(request => request.RequestedRoleId)
			.OnDelete(DeleteBehavior.Restrict);
	}
}
