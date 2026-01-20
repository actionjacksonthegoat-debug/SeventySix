using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Domains.Logging.Migrations
{
	/// <inheritdoc />
	public partial class UpdateTracingColumnsAndIndexes : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.RenameIndex(
				name: "IX_Logs_LogLevel_CreatedAt",
				schema: "Logging",
				table: "Logs",
				newName: "IX_Logs_LogLevel_CreateDate");

			migrationBuilder.RenameIndex(
				name: "IX_Logs_CreatedAt",
				schema: "Logging",
				table: "Logs",
				newName: "IX_Logs_CreateDate");

			migrationBuilder.AlterColumn<string>(
				name: "SpanId",
				schema: "Logging",
				table: "Logs",
				type: "character varying(16)",
				maxLength: 16,
				nullable: true,
				oldClrType: typeof(string),
				oldType: "text",
				oldNullable: true);

			migrationBuilder.AlterColumn<string>(
				name: "ParentSpanId",
				schema: "Logging",
				table: "Logs",
				type: "character varying(16)",
				maxLength: 16,
				nullable: true,
				oldClrType: typeof(string),
				oldType: "text",
				oldNullable: true);

			migrationBuilder.AlterColumn<string>(
				name: "CorrelationId",
				schema: "Logging",
				table: "Logs",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true,
				oldClrType: typeof(string),
				oldType: "text",
				oldNullable: true);

			migrationBuilder.CreateIndex(
				name: "IX_Logs_CorrelationId",
				schema: "Logging",
				table: "Logs",
				column: "CorrelationId");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropIndex(
				name: "IX_Logs_CorrelationId",
				schema: "Logging",
				table: "Logs");

			migrationBuilder.RenameIndex(
				name: "IX_Logs_LogLevel_CreateDate",
				schema: "Logging",
				table: "Logs",
				newName: "IX_Logs_LogLevel_CreatedAt");

			migrationBuilder.RenameIndex(
				name: "IX_Logs_CreateDate",
				schema: "Logging",
				table: "Logs",
				newName: "IX_Logs_CreatedAt");

			migrationBuilder.AlterColumn<string>(
				name: "SpanId",
				schema: "Logging",
				table: "Logs",
				type: "text",
				nullable: true,
				oldClrType: typeof(string),
				oldType: "character varying(16)",
				oldMaxLength: 16,
				oldNullable: true);

			migrationBuilder.AlterColumn<string>(
				name: "ParentSpanId",
				schema: "Logging",
				table: "Logs",
				type: "text",
				nullable: true,
				oldClrType: typeof(string),
				oldType: "character varying(16)",
				oldMaxLength: 16,
				oldNullable: true);

			migrationBuilder.AlterColumn<string>(
				name: "CorrelationId",
				schema: "Logging",
				table: "Logs",
				type: "text",
				nullable: true,
				oldClrType: typeof(string),
				oldType: "character varying(32)",
				oldMaxLength: 32,
				oldNullable: true);
		}
	}
}