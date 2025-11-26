using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Logging.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLogTimestampColumnMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModifiedAt",
                schema: "Logging",
                table: "Logs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAt",
                schema: "Logging",
                table: "Logs",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
