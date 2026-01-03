using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable RCS0053 // Fix formatting of arguments

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class RemoveNeedsPendingEmailFromUsers : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "NeedsPendingEmail",
				schema: "Identity",
				table: "Users");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<bool>(
				name: "NeedsPendingEmail",
				schema: "Identity",
				table: "Users",
				type: "boolean",
				nullable: false,
				defaultValue: false);
		}
	}
}
