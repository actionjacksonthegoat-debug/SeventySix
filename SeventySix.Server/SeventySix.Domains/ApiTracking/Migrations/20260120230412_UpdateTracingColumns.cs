using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Domains.ApiTracking.Migrations
{
	/// <inheritdoc />
	public partial class UpdateTracingColumns : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.RenameIndex(
				name: "IX_ThirdPartyApiRequests_ApiName_ResetDate",
				schema: "ApiTracking",
				table: "ThirdPartyApiRequests",
				newName: "UQ_ThirdPartyApiRequests_ApiName_ResetDate");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.RenameIndex(
				name: "UQ_ThirdPartyApiRequests_ApiName_ResetDate",
				schema: "ApiTracking",
				table: "ThirdPartyApiRequests",
				newName: "IX_ThirdPartyApiRequests_ApiName_ResetDate");
		}
	}
}