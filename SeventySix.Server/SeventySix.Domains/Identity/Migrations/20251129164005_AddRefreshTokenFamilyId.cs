using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddRefreshTokenFamilyId : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<Guid>(
				name: "FamilyId",
				schema: "Identity",
				table: "RefreshTokens",
				type: "uuid",
				nullable: false,
				defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

			migrationBuilder.CreateIndex(
				name: "IX_RefreshTokens_FamilyId",
				schema: "Identity",
				table: "RefreshTokens",
				column: "FamilyId");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropIndex(
				name: "IX_RefreshTokens_FamilyId",
				schema: "Identity",
				table: "RefreshTokens");

			migrationBuilder.DropColumn(
				name: "FamilyId",
				schema: "Identity",
				table: "RefreshTokens");
		}
	}
}
