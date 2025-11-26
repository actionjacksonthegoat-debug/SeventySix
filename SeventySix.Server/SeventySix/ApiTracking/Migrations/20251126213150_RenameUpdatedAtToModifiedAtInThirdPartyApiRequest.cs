using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.ApiTracking.Migrations
{
    /// <inheritdoc />
    public partial class RenameUpdatedAtToModifiedAtInThirdPartyApiRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "ApiTracking",
                table: "ThirdPartyApiRequests");

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAt",
                schema: "ApiTracking",
                table: "ThirdPartyApiRequests",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModifiedAt",
                schema: "ApiTracking",
                table: "ThirdPartyApiRequests");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "ApiTracking",
                table: "ThirdPartyApiRequests",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");
        }
    }
}
