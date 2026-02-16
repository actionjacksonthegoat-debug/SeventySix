using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class MigrateDateTimeToDateTimeOffset : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.UpdateData(
				schema: "Identity",
				table: "Roles",
				keyColumn: "Id",
				keyValue: 1L,
				column: "CreateDate",
				value: new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero));

			migrationBuilder.UpdateData(
				schema: "Identity",
				table: "Roles",
				keyColumn: "Id",
				keyValue: 2L,
				column: "CreateDate",
				value: new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero));

			migrationBuilder.UpdateData(
				schema: "Identity",
				table: "Roles",
				keyColumn: "Id",
				keyValue: 3L,
				column: "CreateDate",
				value: new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero));
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.UpdateData(
				schema: "Identity",
				table: "Roles",
				keyColumn: "Id",
				keyValue: 1L,
				column: "CreateDate",
				value: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

			migrationBuilder.UpdateData(
				schema: "Identity",
				table: "Roles",
				keyColumn: "Id",
				keyValue: 2L,
				column: "CreateDate",
				value: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

			migrationBuilder.UpdateData(
				schema: "Identity",
				table: "Roles",
				keyColumn: "Id",
				keyValue: 3L,
				column: "CreateDate",
				value: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));
		}
	}
}