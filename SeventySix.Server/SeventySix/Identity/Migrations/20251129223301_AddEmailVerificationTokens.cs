using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Identity.Migrations
{
	/// <inheritdoc />
	public partial class AddEmailVerificationTokens : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "email_verification_tokens",
				schema: "identity",
				columns: table => new
				{
					Id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
					Token = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
					ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					IsUsed = table.Column<bool>(type: "boolean", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_email_verification_tokens", x => x.Id);
				});

			migrationBuilder.CreateIndex(
				name: "IX_email_verification_tokens_Email",
				schema: "identity",
				table: "email_verification_tokens",
				column: "Email");

			migrationBuilder.CreateIndex(
				name: "IX_email_verification_tokens_Token",
				schema: "identity",
				table: "email_verification_tokens",
				column: "Token",
				unique: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "email_verification_tokens",
				schema: "identity");
		}
	}
}