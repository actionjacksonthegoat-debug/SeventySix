using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddUserNeedsPendingEmail : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<bool>(
				name: "NeedsPendingEmail",
				schema: "Identity",
				table: "Users",
				type: "boolean",
				nullable: false,
				defaultValue: false);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "NeedsPendingEmail",
				schema: "Identity",
				table: "Users");
		}
	}
}