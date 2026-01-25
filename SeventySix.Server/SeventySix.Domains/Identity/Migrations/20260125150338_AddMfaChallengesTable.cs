using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddMfaChallengesTable : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<bool>(
				name: "MfaEnabled",
				schema: "Identity",
				table: "Users",
				type: "boolean",
				nullable: false,
				defaultValue: false);

			migrationBuilder.CreateTable(
				name: "MfaChallenges",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Token = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
					UserId = table.Column<long>(type: "bigint", nullable: false),
					CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
					ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					Attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
					IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
					ClientIp = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
					CreateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey(
						"PK_MfaChallenges",
						x => x.Id);
					table.ForeignKey(
						name: "FK_MfaChallenges_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "IX_MfaChallenges_Token",
				schema: "Identity",
				table: "MfaChallenges",
				column: "Token",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_MfaChallenges_UserId_ExpiresAt_Active",
				schema: "Identity",
				table: "MfaChallenges",
				columns: new[] { "UserId", "ExpiresAt" },
				filter: "\"IsUsed\" = false");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "MfaChallenges",
				schema: "Identity");

			migrationBuilder.DropColumn(
				name: "MfaEnabled",
				schema: "Identity",
				table: "Users");
		}
	}
}