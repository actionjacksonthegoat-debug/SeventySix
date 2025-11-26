using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Logging.Migrations
{
    /// <inheritdoc />
    public partial class RenameLogTimestampToCreatedAtAndAddModifiedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Timestamp",
                schema: "Logging",
                table: "Logs",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_Logs_Timestamp",
                schema: "Logging",
                table: "Logs",
                newName: "IX_Logs_CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_Logs_LogLevel_Timestamp",
                schema: "Logging",
                table: "Logs",
                newName: "IX_Logs_LogLevel_CreatedAt");

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAt",
                schema: "Logging",
                table: "Logs",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModifiedAt",
                schema: "Logging",
                table: "Logs");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                schema: "Logging",
                table: "Logs",
                newName: "Timestamp");

            migrationBuilder.RenameIndex(
                name: "IX_Logs_LogLevel_CreatedAt",
                schema: "Logging",
                table: "Logs",
                newName: "IX_Logs_LogLevel_Timestamp");

            migrationBuilder.RenameIndex(
                name: "IX_Logs_CreatedAt",
                schema: "Logging",
                table: "Logs",
                newName: "IX_Logs_Timestamp");
        }
    }
}
