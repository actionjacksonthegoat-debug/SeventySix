// <copyright file="PermissionRequestConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>EF Core configuration for <see cref="PermissionRequest"/> entity.</summary>
public class PermissionRequestConfiguration : IEntityTypeConfiguration<PermissionRequest>
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

		builder
			.Property(request => request.UserId)
			.IsRequired();

		builder
			.Property(request => request.RequestedRole)
			.IsRequired()
			.HasMaxLength(50);

		builder
			.Property(request => request.RequestMessage)
			.HasMaxLength(500);

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
			.HasIndex(request => new { request.UserId, request.RequestedRole })
			.IsUnique()
			.HasDatabaseName("IX_PermissionRequests_UserId_Role");

		// FK to User - cascade delete when user is deleted
		builder
			.HasOne(request => request.User)
			.WithMany()
			.HasForeignKey(request => request.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
