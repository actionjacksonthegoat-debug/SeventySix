using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class UpdateUserRoleToAuditableEntity : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.RenameColumn(
				name: "AssignedAt",
				schema: "Identity",
				table: "UserRoles",
				newName: "CreateDate");

			migrationBuilder.AddColumn<string>(
				name: "CreatedBy",
				schema: "Identity",
				table: "UserRoles",
				type: "character varying(256)",
				maxLength: 256,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "ModifiedBy",
				schema: "Identity",
				table: "UserRoles",
				type: "character varying(256)",
				maxLength: 256,
				nullable: true);

			migrationBuilder.AddColumn<DateTime>(
				name: "ModifyDate",
				schema: "Identity",
				table: "UserRoles",
				type: "timestamp with time zone",
				nullable: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "CreatedBy",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropColumn(
				name: "ModifiedBy",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropColumn(
				name: "ModifyDate",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.RenameColumn(
				name: "CreateDate",
				schema: "Identity",
				table: "UserRoles",
				newName: "AssignedAt");
		}
	}
}