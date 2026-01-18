using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Domains.Logging.Migrations
{
	/// <inheritdoc />
	public partial class AddRecurringJobExecutions : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "recurring_job_executions",
				schema: "Logging",
				columns: table => new
				{
					JobName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
					LastExecutedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
					NextScheduledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
					LastExecutedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey(
						"PK_recurring_job_executions",
						x => x.JobName);
				});
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "recurring_job_executions",
				schema: "Logging");
		}
	}
}