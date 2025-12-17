using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddIdentityForeignKeys : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder
				.AlterColumn<int>(
					name: "UserId",
					schema: "Identity",
					table: "UserCredentials",
					type: "integer",
					nullable: false,
					oldClrType: typeof(int),
					oldType: "integer")
				.OldAnnotation(
					"Npgsql:ValueGenerationStrategy",
					NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AddForeignKey(
				name: "FK_ExternalLogins_Users_UserId",
				schema: "Identity",
				table: "ExternalLogins",
				column: "UserId",
				principalSchema: "Identity",
				principalTable: "Users",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade);

			migrationBuilder.AddForeignKey(
				name: "FK_RefreshTokens_Users_UserId",
				schema: "Identity",
				table: "RefreshTokens",
				column: "UserId",
				principalSchema: "Identity",
				principalTable: "Users",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade);

			migrationBuilder.AddForeignKey(
				name: "FK_UserCredentials_Users_UserId",
				schema: "Identity",
				table: "UserCredentials",
				column: "UserId",
				principalSchema: "Identity",
				principalTable: "Users",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade);

			migrationBuilder.AddForeignKey(
				name: "FK_UserRoles_Users_UserId",
				schema: "Identity",
				table: "UserRoles",
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
				name: "FK_ExternalLogins_Users_UserId",
				schema: "Identity",
				table: "ExternalLogins");

			migrationBuilder.DropForeignKey(
				name: "FK_RefreshTokens_Users_UserId",
				schema: "Identity",
				table: "RefreshTokens");

			migrationBuilder.DropForeignKey(
				name: "FK_UserCredentials_Users_UserId",
				schema: "Identity",
				table: "UserCredentials");

			migrationBuilder.DropForeignKey(
				name: "FK_UserRoles_Users_UserId",
				schema: "Identity",
				table: "UserRoles");

			migrationBuilder
				.AlterColumn<int>(
					name: "UserId",
					schema: "Identity",
					table: "UserCredentials",
					type: "integer",
					nullable: false,
					oldClrType: typeof(int),
					oldType: "integer")
				.Annotation(
					"Npgsql:ValueGenerationStrategy",
					NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
		}
	}
}