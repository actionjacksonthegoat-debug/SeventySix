using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class UpdateMfaEnabledDefault : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<bool>(
				name: "MfaEnabled",
				schema: "Identity",
				table: "Users",
				type: "boolean",
				nullable: false,
				defaultValue: true,
				oldClrType: typeof(bool),
				oldType: "boolean");

			// Flip existing users to the secure default
			migrationBuilder.Sql(
				"""
				UPDATE "Identity"."Users" SET "MfaEnabled" = true WHERE "MfaEnabled" = false
				""");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<bool>(
				name: "MfaEnabled",
				schema: "Identity",
				table: "Users",
				type: "boolean",
				nullable: false,
				oldClrType: typeof(bool),
				oldType: "boolean",
				oldDefaultValue: true);
		}
	}
}