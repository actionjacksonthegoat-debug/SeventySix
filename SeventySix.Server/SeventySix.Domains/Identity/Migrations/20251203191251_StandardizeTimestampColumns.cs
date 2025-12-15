using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class StandardizeTimestampColumns : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropPrimaryKey(
				name: "PK_email_verification_tokens",
				schema: "identity",
				table: "email_verification_tokens");

			migrationBuilder.RenameTable(
				name: "email_verification_tokens",
				schema: "identity",
				newName: "EmailVerificationTokens",
				newSchema: "identity");

			migrationBuilder.RenameColumn(
				name: "CreatedAt",
				schema: "Identity",
				table: "UserCredentials",
				newName: "CreateDate");

			migrationBuilder.RenameColumn(
				name: "CreatedAt",
				schema: "Identity",
				table: "RefreshTokens",
				newName: "CreateDate");

			migrationBuilder.RenameColumn(
				name: "CreatedAt",
				schema: "identity",
				table: "PasswordResetTokens",
				newName: "CreateDate");

			migrationBuilder.RenameColumn(
				name: "CreatedAt",
				schema: "Identity",
				table: "ExternalLogins",
				newName: "CreateDate");

			migrationBuilder.RenameColumn(
				name: "CreatedAt",
				schema: "identity",
				table: "EmailVerificationTokens",
				newName: "CreateDate");

			migrationBuilder.RenameIndex(
				name: "IX_email_verification_tokens_Token",
				schema: "identity",
				table: "EmailVerificationTokens",
				newName: "IX_EmailVerificationTokens_Token");

			migrationBuilder.RenameIndex(
				name: "IX_email_verification_tokens_Email",
				schema: "identity",
				table: "EmailVerificationTokens",
				newName: "IX_EmailVerificationTokens_Email");

			migrationBuilder.AddPrimaryKey(
				name: "PK_EmailVerificationTokens",
				schema: "identity",
				table: "EmailVerificationTokens",
				column: "Id");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropPrimaryKey(
				name: "PK_EmailVerificationTokens",
				schema: "identity",
				table: "EmailVerificationTokens");

			migrationBuilder.RenameTable(
				name: "EmailVerificationTokens",
				schema: "identity",
				newName: "email_verification_tokens",
				newSchema: "identity");

			migrationBuilder.RenameColumn(
				name: "CreateDate",
				schema: "Identity",
				table: "UserCredentials",
				newName: "CreatedAt");

			migrationBuilder.RenameColumn(
				name: "CreateDate",
				schema: "Identity",
				table: "RefreshTokens",
				newName: "CreatedAt");

			migrationBuilder.RenameColumn(
				name: "CreateDate",
				schema: "identity",
				table: "PasswordResetTokens",
				newName: "CreatedAt");

			migrationBuilder.RenameColumn(
				name: "CreateDate",
				schema: "Identity",
				table: "ExternalLogins",
				newName: "CreatedAt");

			migrationBuilder.RenameColumn(
				name: "CreateDate",
				schema: "identity",
				table: "email_verification_tokens",
				newName: "CreatedAt");

			migrationBuilder.RenameIndex(
				name: "IX_EmailVerificationTokens_Token",
				schema: "identity",
				table: "email_verification_tokens",
				newName: "IX_email_verification_tokens_Token");

			migrationBuilder.RenameIndex(
				name: "IX_EmailVerificationTokens_Email",
				schema: "identity",
				table: "email_verification_tokens",
				newName: "IX_email_verification_tokens_Email");

			migrationBuilder.AddPrimaryKey(
				name: "PK_email_verification_tokens",
				schema: "identity",
				table: "email_verification_tokens",
				column: "Id");
		}
	}
}
