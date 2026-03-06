using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class RemoveIpColumns : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "LastLoginIp",
				schema: "Identity",
				table: "Users");

			migrationBuilder.DropColumn(
				name: "IpAddress",
				schema: "security",
				table: "SecurityEvents");

			migrationBuilder.DropColumn(
				name: "CreatedByIp",
				schema: "Identity",
				table: "RefreshTokens");

			migrationBuilder.DropColumn(
				name: "ClientIp",
				schema: "Identity",
				table: "MfaChallenges");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<string>(
				name: "LastLoginIp",
				schema: "Identity",
				table: "Users",
				type: "character varying(45)",
				maxLength: 45,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "IpAddress",
				schema: "security",
				table: "SecurityEvents",
				type: "character varying(45)",
				maxLength: 45,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "CreatedByIp",
				schema: "Identity",
				table: "RefreshTokens",
				type: "character varying(45)",
				maxLength: 45,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "ClientIp",
				schema: "Identity",
				table: "MfaChallenges",
				type: "character varying(45)",
				maxLength: 45,
				nullable: true);
		}
	}
}