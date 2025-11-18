using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeUserRowVersionNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<uint>(
                name: "xmin",
                table: "Users",
                type: "xid",
                rowVersion: true,
                nullable: true,
                oldClrType: typeof(uint),
                oldType: "xid",
                oldRowVersion: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<uint>(
                name: "xmin",
                table: "Users",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u,
                oldClrType: typeof(uint),
                oldType: "xid",
                oldRowVersion: true,
                oldNullable: true);
        }
    }
}
