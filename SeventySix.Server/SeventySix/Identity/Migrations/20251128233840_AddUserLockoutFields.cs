using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddUserLockoutFields : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<int>(
				name: "FailedLoginCount",
				schema: "Identity",
				table: "Users",
				type: "integer",
				nullable: false,
				defaultValue: 0);

			migrationBuilder.AddColumn<DateTime>(
				name: "LockoutEndUtc",
				schema: "Identity",
				table: "Users",
				type: "timestamp with time zone",
				nullable: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "FailedLoginCount",
				schema: "Identity",
				table: "Users");

			migrationBuilder.DropColumn(
				name: "LockoutEndUtc",
				schema: "Identity",
				table: "Users");
		}
	}
}