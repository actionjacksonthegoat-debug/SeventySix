using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class HashPasswordResetTokens : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropIndex(
				name: "IX_PasswordResetTokens_Token",
				schema: "identity",
				table: "PasswordResetTokens");

			migrationBuilder.DropColumn(
				name: "Token",
				schema: "identity",
				table: "PasswordResetTokens");

			migrationBuilder.AddColumn<string>(
				name: "TokenHash",
				schema: "identity",
				table: "PasswordResetTokens",
				type: "character varying(64)",
				maxLength: 64,
				nullable: false,
				defaultValue: "");

			migrationBuilder.CreateIndex(
				name: "IX_PasswordResetTokens_TokenHash",
				schema: "identity",
				table: "PasswordResetTokens",
				column: "TokenHash",
				unique: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropIndex(
				name: "IX_PasswordResetTokens_TokenHash",
				schema: "identity",
				table: "PasswordResetTokens");

			migrationBuilder.DropColumn(
				name: "TokenHash",
				schema: "identity",
				table: "PasswordResetTokens");

			migrationBuilder.AddColumn<string>(
				name: "Token",
				schema: "identity",
				table: "PasswordResetTokens",
				type: "character varying(128)",
				maxLength: 128,
				nullable: false,
				defaultValue: "");

			migrationBuilder.CreateIndex(
				name: "IX_PasswordResetTokens_Token",
				schema: "identity",
				table: "PasswordResetTokens",
				column: "Token",
				unique: true);
		}
	}
}