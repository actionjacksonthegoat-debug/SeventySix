using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SeventySix.Domains.Logging.Migrations
{
	/// <inheritdoc />
	public partial class PendingModelChanges_Logging : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Logging",
				table: "Logs",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Logging",
				table: "Logs",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
		}
	}
}
