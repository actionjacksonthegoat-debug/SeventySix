using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddPasswordResetToken : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.EnsureSchema(
				name: "identity");

			migrationBuilder.CreateTable(
				name: "PasswordResetTokens",
				schema: "identity",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<int>(type: "integer", nullable: false),
					Token = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
					ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					IsUsed = table.Column<bool>(type: "boolean", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
				});

			migrationBuilder.CreateIndex(
				name: "IX_PasswordResetTokens_Token",
				schema: "identity",
				table: "PasswordResetTokens",
				column: "Token",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_PasswordResetTokens_UserId",
				schema: "identity",
				table: "PasswordResetTokens",
				column: "UserId");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "PasswordResetTokens",
				schema: "identity");
		}
	}
}