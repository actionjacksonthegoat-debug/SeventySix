using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Domains.Identity.Infrastructure.Migrations
{
	/// <inheritdoc />
	public partial class AddAltchaChallengesTable : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "AltchaChallenges",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<long>(
						type: "bigint",
						nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Challenge = table.Column<string>(
						type: "character varying(256)",
						maxLength: 256,
						nullable: false),
					ExpiryUtc = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey(
						"PK_AltchaChallenges",
						altchaChallenges => altchaChallenges.Id);
				});

			migrationBuilder.CreateIndex(
				name: "IX_AltchaChallenges_Challenge",
				schema: "Identity",
				table: "AltchaChallenges",
				column: "Challenge",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_AltchaChallenges_ExpiryUtc",
				schema: "Identity",
				table: "AltchaChallenges",
				column: "ExpiryUtc");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "AltchaChallenges",
				schema: "Identity");
		}
	}
}
