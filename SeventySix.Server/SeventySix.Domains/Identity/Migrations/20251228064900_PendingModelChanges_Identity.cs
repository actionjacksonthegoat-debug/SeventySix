using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class PendingModelChanges_Identity : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "Users",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<long>(
				name: "UserId",
				schema: "Identity",
				table: "UserRoles",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "RoleId",
				schema: "Identity",
				table: "UserRoles",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "UserRoles",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<long>(
				name: "UserId",
				schema: "Identity",
				table: "UserCredentials",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "SecurityRoles",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<long>(
				name: "UserId",
				schema: "Identity",
				table: "RefreshTokens",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "RefreshTokens",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<long>(
				name: "UserId",
				schema: "Identity",
				table: "PermissionRequests",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "PermissionRequests",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<long>(
				name: "UserId",
				schema: "Identity",
				table: "PasswordResetTokens",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "PasswordResetTokens",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<long>(
				name: "UserId",
				schema: "Identity",
				table: "ExternalLogins",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer");

			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "ExternalLogins",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<long>(
				name: "Id",
				schema: "Identity",
				table: "EmailVerificationTokens",
				type: "bigint",
				nullable: false,
				oldClrType: typeof(int),
				oldType: "integer")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.Sql(@"INSERT INTO ""Identity"".""SecurityRoles"" (""Id"", ""CreateDate"", ""Description"", ""IsActive"", ""Name"") VALUES (1, '2025-01-01 00:00:00+00', 'Standard user access', true, 'User') ON CONFLICT (""Id"") DO UPDATE SET ""CreateDate"" = EXCLUDED.""CreateDate"", ""Description"" = EXCLUDED.""Description"", ""IsActive"" = EXCLUDED.""IsActive"", ""Name"" = EXCLUDED.""Name"";");

			migrationBuilder.Sql(@"INSERT INTO ""Identity"".""SecurityRoles"" (""Id"", ""CreateDate"", ""Description"", ""IsActive"", ""Name"") VALUES (2, '2025-01-01 00:00:00+00', 'Access to developer tools and APIs', true, 'Developer') ON CONFLICT (""Id"") DO UPDATE SET ""CreateDate"" = EXCLUDED.""CreateDate"", ""Description"" = EXCLUDED.""Description"", ""IsActive"" = EXCLUDED.""IsActive"", ""Name"" = EXCLUDED.""Name"";");

			migrationBuilder.Sql(@"INSERT INTO ""Identity"".""SecurityRoles"" (""Id"", ""CreateDate"", ""Description"", ""IsActive"", ""Name"") VALUES (3, '2025-01-01 00:00:00+00', 'Full administrative access', true, 'Admin') ON CONFLICT (""Id"") DO UPDATE SET ""CreateDate"" = EXCLUDED.""CreateDate"", ""Description"" = EXCLUDED.""Description"", ""IsActive"" = EXCLUDED.""IsActive"", ""Name"" = EXCLUDED.""Name"";");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DeleteData(
				schema: "Identity",
				table: "SecurityRoles",
				keyColumn: "Id",
				keyValue: 1L);

			migrationBuilder.DeleteData(
				schema: "Identity",
				table: "SecurityRoles",
				keyColumn: "Id",
				keyValue: 2L);

			migrationBuilder.DeleteData(
				schema: "Identity",
				table: "SecurityRoles",
				keyColumn: "Id",
				keyValue: 3L);

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "Users",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<int>(
				name: "UserId",
				schema: "Identity",
				table: "UserRoles",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "RoleId",
				schema: "Identity",
				table: "UserRoles",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "UserRoles",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<int>(
				name: "UserId",
				schema: "Identity",
				table: "UserCredentials",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "SecurityRoles",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<int>(
				name: "UserId",
				schema: "Identity",
				table: "RefreshTokens",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "RefreshTokens",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<int>(
				name: "UserId",
				schema: "Identity",
				table: "PermissionRequests",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "PermissionRequests",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<int>(
				name: "UserId",
				schema: "Identity",
				table: "PasswordResetTokens",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "PasswordResetTokens",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<int>(
				name: "UserId",
				schema: "Identity",
				table: "ExternalLogins",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint");

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "ExternalLogins",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AlterColumn<int>(
				name: "Id",
				schema: "Identity",
				table: "EmailVerificationTokens",
				type: "integer",
				nullable: false,
				oldClrType: typeof(long),
				oldType: "bigint")
				.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
				.OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.InsertData(
				schema: "Identity",
				table: "SecurityRoles",
				columns: new[] { "Id", "CreateDate", "Description", "IsActive", "Name" },
				values: new object[,]
				{
					{ 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Standard user access", true, "User" },
					{ 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Access to developer tools and APIs", true, "Developer" },
					{ 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Full administrative access", true, "Admin" }
				});
		}
	}
}
