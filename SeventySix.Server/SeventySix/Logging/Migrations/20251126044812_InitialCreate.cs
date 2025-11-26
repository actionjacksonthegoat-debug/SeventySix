using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Logging.Migrations
{
	/// <inheritdoc />
	public partial class InitialCreate : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.EnsureSchema(
				name: "Logging");

			migrationBuilder.CreateTable(
				name: "Logs",
				schema: "Logging",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					LogLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
					Message = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
					ExceptionMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
					BaseExceptionMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
					StackTrace = table.Column<string>(type: "text", nullable: true),
					SourceContext = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
					RequestMethod = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
					RequestPath = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
					StatusCode = table.Column<int>(type: "integer", nullable: true),
					DurationMs = table.Column<long>(type: "bigint", nullable: true),
					Properties = table.Column<string>(type: "text", nullable: true),
					Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
					MachineName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
					Environment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
					CorrelationId = table.Column<string>(type: "text", nullable: true),
					SpanId = table.Column<string>(type: "text", nullable: true),
					ParentSpanId = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_logs", x => x.Id);
				});

			migrationBuilder.CreateIndex(
				name: "IX_Logs_LogLevel",
				schema: "Logging",
				table: "Logs",
				column: "LogLevel");

			migrationBuilder.CreateIndex(
				name: "IX_Logs_LogLevel_Timestamp",
				schema: "Logging",
				table: "Logs",
				columns: new[] { "LogLevel", "Timestamp" });

			migrationBuilder.CreateIndex(
				name: "IX_Logs_RequestPath",
				schema: "Logging",
				table: "Logs",
				column: "RequestPath");

			migrationBuilder.CreateIndex(
				name: "IX_Logs_SourceContext",
				schema: "Logging",
				table: "Logs",
				column: "SourceContext");

			migrationBuilder.CreateIndex(
				name: "IX_Logs_Timestamp",
				schema: "Logging",
				table: "Logs",
				column: "Timestamp");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "Logs",
				schema: "Logging");
		}
	}
}
