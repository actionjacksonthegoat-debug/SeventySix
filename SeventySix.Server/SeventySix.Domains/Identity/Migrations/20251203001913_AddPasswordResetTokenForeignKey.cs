using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddPasswordResetTokenForeignKey : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddForeignKey(
				name: "FK_PasswordResetTokens_Users_UserId",
				schema: "identity",
				table: "PasswordResetTokens",
				column: "UserId",
				principalSchema: "Identity",
				principalTable: "Users",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropForeignKey(
				name: "FK_PasswordResetTokens_Users_UserId",
				schema: "identity",
				table: "PasswordResetTokens");
		}
	}
}