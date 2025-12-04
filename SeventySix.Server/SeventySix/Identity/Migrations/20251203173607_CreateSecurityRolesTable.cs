using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class CreateSecurityRolesTable : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			// Step 1: Create SecurityRoles table with seed data FIRST
			migrationBuilder.CreateTable(
				name: "SecurityRoles",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
					Description = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
					IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
					CreateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_SecurityRoles", x => x.Id);
				});

			migrationBuilder.InsertData(
				schema: "Identity",
				table: "SecurityRoles",
				columns: new[] { "Id", "CreateDate", "Description", "IsActive", "Name" },
				values: new object[,]
				{
					{ 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Standard user access", true, "User" },
					{ 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Access to developer tools and APIs", true, "Developer" },
					{ 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Full administrative access", true, "Admin" }
				});

			migrationBuilder.CreateIndex(
				name: "IX_SecurityRoles_Name",
				schema: "Identity",
				table: "SecurityRoles",
				column: "Name",
				unique: true);

			// Step 2: Add RoleId columns (nullable initially for data migration)
			migrationBuilder.AddColumn<int>(
				name: "RoleId",
				schema: "Identity",
				table: "UserRoles",
				type: "integer",
				nullable: true);

			migrationBuilder.AddColumn<int>(
				name: "RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests",
				type: "integer",
				nullable: true);

			// Step 3: Migrate existing data from Role (string) to RoleId (int)
			migrationBuilder.Sql("""
                UPDATE "Identity"."UserRoles" ur
                SET "RoleId" = sr."Id"
                FROM "Identity"."SecurityRoles" sr
                WHERE ur."Role" = sr."Name"
                """);

			migrationBuilder.Sql("""
                UPDATE "Identity"."PermissionRequests" pr
                SET "RequestedRoleId" = sr."Id"
                FROM "Identity"."SecurityRoles" sr
                WHERE pr."RequestedRole" = sr."Name"
                """);

			// Step 4: Make RoleId columns NOT NULL now that data is migrated
			migrationBuilder.AlterColumn<int>(
				name: "RoleId",
				schema: "Identity",
				table: "UserRoles",
				type: "integer",
				nullable: false,
				defaultValue: 0);

			migrationBuilder.AlterColumn<int>(
				name: "RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests",
				type: "integer",
				nullable: false,
				defaultValue: 0);

			// Step 5: Drop old string-based indexes and columns
			migrationBuilder.DropIndex(
				name: "IX_UserRoles_Role",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropIndex(
				name: "IX_UserRoles_UserId_Role",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropIndex(
				name: "IX_PermissionRequests_UserId_Role",
				schema: "Identity",
				table: "PermissionRequests");

			migrationBuilder.DropColumn(
				name: "Role",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropColumn(
				name: "RequestedRole",
				schema: "Identity",
				table: "PermissionRequests");

			// Step 6: Create new indexes and FK constraints
			migrationBuilder.CreateIndex(
				name: "IX_UserRoles_RoleId",
				schema: "Identity",
				table: "UserRoles",
				column: "RoleId");

			migrationBuilder.CreateIndex(
				name: "IX_UserRoles_UserId_RoleId",
				schema: "Identity",
				table: "UserRoles",
				columns: new[] { "UserId", "RoleId" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_PermissionRequests_RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests",
				column: "RequestedRoleId");

			migrationBuilder.CreateIndex(
				name: "IX_PermissionRequests_UserId_RoleId",
				schema: "Identity",
				table: "PermissionRequests",
				columns: new[] { "UserId", "RequestedRoleId" },
				unique: true);

			migrationBuilder.AddForeignKey(
				name: "FK_PermissionRequests_SecurityRoles_RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests",
				column: "RequestedRoleId",
				principalSchema: "Identity",
				principalTable: "SecurityRoles",
				principalColumn: "Id",
				onDelete: ReferentialAction.Restrict);

			migrationBuilder.AddForeignKey(
				name: "FK_UserRoles_SecurityRoles_RoleId",
				schema: "Identity",
				table: "UserRoles",
				column: "RoleId",
				principalSchema: "Identity",
				principalTable: "SecurityRoles",
				principalColumn: "Id",
				onDelete: ReferentialAction.Restrict);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// Step 1: Drop FK constraints
			migrationBuilder.DropForeignKey(
				name: "FK_PermissionRequests_SecurityRoles_RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests");

			migrationBuilder.DropForeignKey(
				name: "FK_UserRoles_SecurityRoles_RoleId",
				schema: "Identity",
				table: "UserRoles");

			// Step 2: Drop new indexes
			migrationBuilder.DropIndex(
				name: "IX_UserRoles_RoleId",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropIndex(
				name: "IX_UserRoles_UserId_RoleId",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropIndex(
				name: "IX_PermissionRequests_RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests");

			migrationBuilder.DropIndex(
				name: "IX_PermissionRequests_UserId_RoleId",
				schema: "Identity",
				table: "PermissionRequests");

			// Step 3: Add back string Role columns
			migrationBuilder.AddColumn<string>(
				name: "Role",
				schema: "Identity",
				table: "UserRoles",
				type: "character varying(50)",
				maxLength: 50,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "RequestedRole",
				schema: "Identity",
				table: "PermissionRequests",
				type: "character varying(50)",
				maxLength: 50,
				nullable: true);

			// Step 4: Migrate data back from RoleId to Role string
			migrationBuilder.Sql("""
                UPDATE "Identity"."UserRoles" ur
                SET "Role" = sr."Name"
                FROM "Identity"."SecurityRoles" sr
                WHERE ur."RoleId" = sr."Id"
                """);

			migrationBuilder.Sql("""
                UPDATE "Identity"."PermissionRequests" pr
                SET "RequestedRole" = sr."Name"
                FROM "Identity"."SecurityRoles" sr
                WHERE pr."RequestedRoleId" = sr."Id"
                """);

			// Step 5: Make Role columns NOT NULL
			migrationBuilder.AlterColumn<string>(
				name: "Role",
				schema: "Identity",
				table: "UserRoles",
				type: "character varying(50)",
				maxLength: 50,
				nullable: false,
				defaultValue: "");

			migrationBuilder.AlterColumn<string>(
				name: "RequestedRole",
				schema: "Identity",
				table: "PermissionRequests",
				type: "character varying(50)",
				maxLength: 50,
				nullable: false,
				defaultValue: "");

			// Step 6: Drop RoleId columns
			migrationBuilder.DropColumn(
				name: "RoleId",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder.DropColumn(
				name: "RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests");

			// Step 7: Drop SecurityRoles table
			migrationBuilder.DropTable(
				name: "SecurityRoles",
				schema: "Identity");

			// Step 8: Recreate old indexes
			migrationBuilder.CreateIndex(
				name: "IX_UserRoles_Role",
				schema: "Identity",
				table: "UserRoles",
				column: "Role");

			migrationBuilder.CreateIndex(
				name: "IX_UserRoles_UserId_Role",
				schema: "Identity",
				table: "UserRoles",
				columns: new[] { "UserId", "Role" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_PermissionRequests_UserId_Role",
				schema: "Identity",
				table: "PermissionRequests",
				columns: new[] { "UserId", "RequestedRole" },
				unique: true);
		}
	}
}