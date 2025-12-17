using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class HashEmailVerificationTokens : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropIndex(
				name: "IX_EmailVerificationTokens_Token",
				schema: "identity",
				table: "EmailVerificationTokens");

			migrationBuilder.DropColumn(
				name: "Token",
				schema: "identity",
				table: "EmailVerificationTokens");

			migrationBuilder.AddColumn<string>(
				name: "TokenHash",
				schema: "identity",
				table: "EmailVerificationTokens",
				type: "character varying(64)",
				maxLength: 64,
				nullable: false,
				defaultValue: "");

			migrationBuilder.CreateIndex(
				name: "IX_EmailVerificationTokens_TokenHash",
				schema: "identity",
				table: "EmailVerificationTokens",
				column: "TokenHash",
				unique: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropIndex(
				name: "IX_EmailVerificationTokens_TokenHash",
				schema: "identity",
				table: "EmailVerificationTokens");

			migrationBuilder.DropColumn(
				name: "TokenHash",
				schema: "identity",
				table: "EmailVerificationTokens");

			migrationBuilder.AddColumn<string>(
				name: "Token",
				schema: "identity",
				table: "EmailVerificationTokens",
				type: "character varying(128)",
				maxLength: 128,
				nullable: false,
				defaultValue: "");

			migrationBuilder.CreateIndex(
				name: "IX_EmailVerificationTokens_Token",
				schema: "identity",
				table: "EmailVerificationTokens",
				column: "Token",
				unique: true);
		}
	}
}