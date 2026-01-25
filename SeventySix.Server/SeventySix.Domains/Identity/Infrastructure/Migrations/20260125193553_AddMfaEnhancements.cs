using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Domains.Identity.Infrastructure.Migrations
{
	/// <inheritdoc />
	public partial class AddMfaEnhancements : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<DateTime>(
				name: "TotpEnrolledAt",
				schema: "Identity",
				table: "Users",
				type: "timestamp with time zone",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "TotpSecret",
				schema: "Identity",
				table: "Users",
				type: "character varying(64)",
				maxLength: 64,
				nullable: true);

			migrationBuilder.CreateTable(
				name: "BackupCodes",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<long>(type: "bigint", nullable: false),
					CodeHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
					IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
					UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					CreateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey(
						"PK_BackupCodes",
						x => x.Id);
					table.ForeignKey(
						name: "FK_BackupCodes_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "TrustedDevices",
				schema: "Identity",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<long>(type: "bigint", nullable: false),
					TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
					DeviceFingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
					DeviceName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
					ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					CreateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
					ModifyDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey(
						"PK_TrustedDevices",
						x => x.Id);
					table.ForeignKey(
						name: "FK_TrustedDevices_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "IX_BackupCodes_UserId_IsUsed",
				schema: "Identity",
				table: "BackupCodes",
				columns: new[] { "UserId", "IsUsed" });

			migrationBuilder.CreateIndex(
				name: "IX_TrustedDevices_TokenHash",
				schema: "Identity",
				table: "TrustedDevices",
				column: "TokenHash",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_TrustedDevices_UserId",
				schema: "Identity",
				table: "TrustedDevices",
				column: "UserId");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "BackupCodes",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "TrustedDevices",
				schema: "Identity");

			migrationBuilder.DropColumn(
				name: "TotpEnrolledAt",
				schema: "Identity",
				table: "Users");

			migrationBuilder.DropColumn(
				name: "TotpSecret",
				schema: "Identity",
				table: "Users");
		}
	}
}