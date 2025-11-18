using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Data.Migrations
{
	/// <inheritdoc />
	public partial class AddOpenTelemetryTracking : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<string>(
				name: "CorrelationId",
				table: "Logs",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "ParentSpanId",
				table: "Logs",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "SpanId",
				table: "Logs",
				type: "text",
				nullable: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "CorrelationId",
				table: "Logs");

			migrationBuilder.DropColumn(
				name: "ParentSpanId",
				table: "Logs");

			migrationBuilder.DropColumn(
				name: "SpanId",
				table: "Logs");
		}
	}
}