using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class InitialCreate : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.EnsureSchema(
				name: "Identity");
			migrationBuilder.CreateTable(
				name: "Users",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
					Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
					FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
					CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
					CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
					ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
					IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
					IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
					DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					DeletedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
					xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: true),
					Preferences = table.Column<string>(type: "jsonb", nullable: true),
					LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					LastLoginIp = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Users", x => x.Id);
				});

			migrationBuilder.CreateIndex(
				name: "IX_Users_CreatedAt",
				schema: "Identity",
				table: "Users",
				column: "CreatedAt");

			migrationBuilder.CreateIndex(
				name: "IX_Users_Email",
				schema: "Identity",
				table: "Users",
				column: "Email",
				unique: true,
				filter: "\"IsDeleted\" = false");

			migrationBuilder.CreateIndex(
				name: "IX_Users_IsActive_CreatedAt",
				schema: "Identity",
				table: "Users",
				columns: new[] { "IsActive", "CreatedAt" });

			migrationBuilder.CreateIndex(
				name: "IX_Users_IsDeleted",
				schema: "Identity",
				table: "Users",
				column: "IsDeleted");

			migrationBuilder.CreateIndex(
				name: "IX_Users_Username",
				schema: "Identity",
				table: "Users",
				column: "Username",
				unique: true,
				filter: "\"IsDeleted\" = false");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "Users",
				schema: "Identity");
		}
	}
}
