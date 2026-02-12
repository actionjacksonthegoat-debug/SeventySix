using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class IncreaseTotpSecretMaxLength : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<string>(
				name: "TotpSecret",
				schema: "Identity",
				table: "Users",
				type: "character varying(512)",
				maxLength: 512,
				nullable: true,
				oldClrType: typeof(string),
				oldType: "character varying(64)",
				oldMaxLength: 64,
				oldNullable: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<string>(
				name: "TotpSecret",
				schema: "Identity",
				table: "Users",
				type: "character varying(64)",
				maxLength: 64,
				nullable: true,
				oldClrType: typeof(string),
				oldType: "character varying(512)",
				oldMaxLength: 512,
				oldNullable: true);
		}
	}
}