using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddAuthEntities : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "ExternalLogins",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<int>(type: "integer", nullable: false),
					Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
					ProviderUserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
					ProviderEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
					CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
					LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_ExternalLogins", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "RefreshTokens",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
					UserId = table.Column<int>(type: "integer", nullable: false),
					ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
					IsRevoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
					RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					CreatedByIp = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_RefreshTokens", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "UserCredentials",
				schema: "Identity",
				columns: table => new
				{
					UserId = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					PasswordHash = table.Column<string>(type: "character varying(72)", maxLength: 72, nullable: false),
					PasswordChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_UserCredentials", x => x.UserId);
				});

			migrationBuilder.CreateTable(
				name: "UserRoles",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<int>(type: "integer", nullable: false),
					Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
					AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_UserRoles", x => x.Id);
				});

			migrationBuilder.CreateIndex(
				name: "IX_ExternalLogins_Provider_ProviderUserId",
				schema: "Identity",
				table: "ExternalLogins",
				columns: new[] { "Provider", "ProviderUserId" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_ExternalLogins_UserId",
				schema: "Identity",
				table: "ExternalLogins",
				column: "UserId");

			migrationBuilder.CreateIndex(
				name: "IX_RefreshTokens_TokenHash",
				schema: "Identity",
				table: "RefreshTokens",
				column: "TokenHash",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_RefreshTokens_UserId_IsRevoked",
				schema: "Identity",
				table: "RefreshTokens",
				columns: new[] { "UserId", "IsRevoked" });

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
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "ExternalLogins",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "RefreshTokens",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "UserCredentials",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "UserRoles",
				schema: "Identity");
		}
	}
}