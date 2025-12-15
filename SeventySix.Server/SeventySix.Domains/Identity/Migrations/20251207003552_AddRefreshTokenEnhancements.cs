using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddRefreshTokenEnhancements : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<DateTime>(
				name: "SessionStartedAt",
				schema: "Identity",
				table: "RefreshTokens",
				type: "timestamp with time zone",
				nullable: false,
				defaultValue: new DateTime(
					1,
					1,
					1,
					0,
					0,
					0,
					0,
					DateTimeKind.Unspecified));
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "SessionStartedAt",
				schema: "Identity",
				table: "RefreshTokens");
		}
	}
}
