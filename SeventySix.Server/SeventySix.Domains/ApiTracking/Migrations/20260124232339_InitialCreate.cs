using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Domains.ApiTracking.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "ApiTracking");

            migrationBuilder.CreateTable(
                name: "ThirdPartyApiRequests",
                schema: "ApiTracking",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ApiName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BaseUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CallCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastCalledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResetDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ModifyDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false, defaultValue: 0u)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThirdPartyApiRequests", x => x.Id);
                    table.CheckConstraint("CK_ThirdPartyApiRequests_CallCount", "\"CallCount\" >= 0");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ThirdPartyApiRequests_LastCalledAt",
                schema: "ApiTracking",
                table: "ThirdPartyApiRequests",
                column: "LastCalledAt");

            migrationBuilder.CreateIndex(
                name: "UQ_ThirdPartyApiRequests_ApiName_ResetDate",
                schema: "ApiTracking",
                table: "ThirdPartyApiRequests",
                columns: new[] { "ApiName", "ResetDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ThirdPartyApiRequests",
                schema: "ApiTracking");
        }
    }
}
