using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SeventySix.Domains.Identity.Migrations
{
	/// <inheritdoc />
	public partial class InitialCreate : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.EnsureSchema(name: "Identity");

			migrationBuilder.CreateTable(
				name: "EmailVerificationTokens",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Email = table.Column<string>(
						type: "character varying(255)",
						maxLength: 255,
						nullable: false),
					TokenHash = table.Column<string>(
						type: "character varying(64)",
						maxLength: 64,
						nullable: false),
					ExpiresAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false),
					IsUsed = table.Column<bool>(
						type: "boolean",
						nullable: false),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_EmailVerificationTokens", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "SecurityRoles",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Name = table.Column<string>(
						type: "character varying(50)",
						maxLength: 50,
						nullable: false),
					Description = table.Column<string>(
						type: "character varying(256)",
						maxLength: 256,
						nullable: true),
					IsActive = table.Column<bool>(
						type: "boolean",
						nullable: false,
						defaultValue: true),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false,
						defaultValueSql: "NOW()"),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_SecurityRoles", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "Users",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Username = table.Column<string>(
						type: "character varying(50)",
						maxLength: 50,
						nullable: false),
					Email = table.Column<string>(
						type: "character varying(255)",
						maxLength: 255,
						nullable: false),
					FullName = table.Column<string>(
						type: "character varying(100)",
						maxLength: 100,
						nullable: true),
					CreatedAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false,
						defaultValueSql: "NOW()"),
					CreatedBy = table.Column<string>(
						type: "character varying(100)",
						maxLength: 100,
						nullable: false,
						defaultValue: "System"),
					ModifiedAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
					ModifiedBy = table.Column<string>(
						type: "character varying(100)",
						maxLength: 100,
						nullable: false,
						defaultValue: "System"),
					IsActive = table.Column<bool>(
						type: "boolean",
						nullable: false,
						defaultValue: true),
					NeedsPendingEmail = table.Column<bool>(
						type: "boolean",
						nullable: false),
					IsDeleted = table.Column<bool>(
						type: "boolean",
						nullable: false,
						defaultValue: false),
					DeletedAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
					DeletedBy = table.Column<string>(
						type: "character varying(100)",
						maxLength: 100,
						nullable: true),
					xmin = table.Column<uint>(
						type: "xid",
						rowVersion: true,
						nullable: true),
					Preferences = table.Column<string>(
						type: "jsonb",
						nullable: true),
					LastLoginAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
					LastLoginIp = table.Column<string>(
						type: "character varying(45)",
						maxLength: 45,
						nullable: true),
					FailedLoginCount = table.Column<int>(
						type: "integer",
						nullable: false,
						defaultValue: 0),
					LockoutEndUtc = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Users", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "ExternalLogins",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<int>(
						type: "integer",
						nullable: false),
					Provider = table.Column<string>(
						type: "character varying(50)",
						maxLength: 50,
						nullable: false),
					ProviderUserId = table.Column<string>(
						type: "character varying(255)",
						maxLength: 255,
						nullable: false),
					ProviderEmail = table.Column<string>(
						type: "character varying(255)",
						maxLength: 255,
						nullable: true),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false,
						defaultValueSql: "NOW()"),
					LastUsedAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_ExternalLogins", x => x.Id);
					table.ForeignKey(
						name: "FK_ExternalLogins_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "PasswordResetTokens",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<int>(
						type: "integer",
						nullable: false),
					TokenHash = table.Column<string>(
						type: "character varying(64)",
						maxLength: 64,
						nullable: false),
					ExpiresAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false),
					IsUsed = table.Column<bool>(
						type: "boolean",
						nullable: false),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
					table.ForeignKey(
						name: "FK_PasswordResetTokens_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "PermissionRequests",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<int>(
						type: "integer",
						nullable: false),
					RequestedRoleId = table.Column<int>(
						type: "integer",
						nullable: false),
					RequestMessage = table.Column<string>(
						type: "character varying(500)",
						maxLength: 500,
						nullable: true),
					CreatedBy = table.Column<string>(
						type: "character varying(50)",
						maxLength: 50,
						nullable: false),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_PermissionRequests", x => x.Id);
					table.ForeignKey(
						name: "FK_PermissionRequests_SecurityRoles_RequestedRoleId",
						column: x => x.RequestedRoleId,
						principalSchema: "Identity",
						principalTable: "SecurityRoles",
						principalColumn: "Id",
						onDelete: ReferentialAction.Restrict);
					table.ForeignKey(
						name: "FK_PermissionRequests_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "RefreshTokens",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					TokenHash = table.Column<string>(
						type: "character varying(64)",
						maxLength: 64,
						nullable: false),
					FamilyId = table.Column<Guid>(
						type: "uuid",
						nullable: false),
					UserId = table.Column<int>(
						type: "integer",
						nullable: false),
					ExpiresAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false),
					SessionStartedAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false,
						defaultValueSql: "NOW()"),
					IsRevoked = table.Column<bool>(
						type: "boolean",
						nullable: false,
						defaultValue: false),
					RevokedAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
					CreatedByIp = table.Column<string>(
						type: "character varying(45)",
						maxLength: 45,
						nullable: true),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_RefreshTokens", x => x.Id);
					table.ForeignKey(
						name: "FK_RefreshTokens_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "UserCredentials",
				schema: "Identity",
				columns: table => new
				{
					UserId = table.Column<int>(
						type: "integer",
						nullable: false),
					PasswordHash = table.Column<string>(
						type: "character varying(150)",
						maxLength: 150,
						nullable: false),
					PasswordChangedAt = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false,
						defaultValueSql: "NOW()"),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_UserCredentials", x => x.UserId);
					table.ForeignKey(
						name: "FK_UserCredentials_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "UserRoles",
				schema: "Identity",
				columns: table => new
				{
					Id = table
						.Column<int>(type: "integer", nullable: false)
						.Annotation(
							"Npgsql:ValueGenerationStrategy",
							NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<int>(
						type: "integer",
						nullable: false),
					RoleId = table.Column<int>(
						type: "integer",
						nullable: false),
					CreateDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false,
						defaultValueSql: "NOW()"),
					ModifyDate = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: true),
					CreatedBy = table.Column<string>(
						type: "character varying(256)",
						maxLength: 256,
						nullable: true),
					ModifiedBy = table.Column<string>(
						type: "character varying(256)",
						maxLength: 256,
						nullable: true),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_UserRoles", x => x.Id);
					table.ForeignKey(
						name: "FK_UserRoles_SecurityRoles_RoleId",
						column: x => x.RoleId,
						principalSchema: "Identity",
						principalTable: "SecurityRoles",
						principalColumn: "Id",
						onDelete: ReferentialAction.Restrict);
					table.ForeignKey(
						name: "FK_UserRoles_Users_UserId",
						column: x => x.UserId,
						principalSchema: "Identity",
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.InsertData(
				schema: "Identity",
				table: "SecurityRoles",
				columns: new[]
				{
					"Id",
					"CreateDate",
					"Description",
					"IsActive",
					"Name",
				},
				values: new object[,]
				{
					{
						1,
						new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
						"Standard user access",
						true,
						"User",
					},
					{
						2,
						new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
						"Access to developer tools and APIs",
						true,
						"Developer",
					},
					{
						3,
						new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc),
						"Full administrative access",
						true,
						"Admin",
					},
				});

			migrationBuilder.CreateIndex(
				name: "IX_EmailVerificationTokens_Email",
				schema: "Identity",
				table: "EmailVerificationTokens",
				column: "Email");

			migrationBuilder.CreateIndex(
				name: "IX_EmailVerificationTokens_TokenHash",
				schema: "Identity",
				table: "EmailVerificationTokens",
				column: "TokenHash",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_ExternalLogins_Provider_ProviderUserId",
				schema: "Identity",
				table: "ExternalLogins",
				columns: new[] { "Provider", "ProviderUserId" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_ExternalLogins_UserId",
				schema: "Identity",
				table: "ExternalLogins",
				column: "UserId");

			migrationBuilder.CreateIndex(
				name: "IX_PasswordResetTokens_TokenHash",
				schema: "Identity",
				table: "PasswordResetTokens",
				column: "TokenHash",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_PasswordResetTokens_UserId",
				schema: "Identity",
				table: "PasswordResetTokens",
				column: "UserId");

			migrationBuilder.CreateIndex(
				name: "IX_PermissionRequests_RequestedRoleId",
				schema: "Identity",
				table: "PermissionRequests",
				column: "RequestedRoleId");

			migrationBuilder.CreateIndex(
				name: "IX_PermissionRequests_UserId_RoleId",
				schema: "Identity",
				table: "PermissionRequests",
				columns: new[] { "UserId", "RequestedRoleId" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_RefreshTokens_FamilyId",
				schema: "Identity",
				table: "RefreshTokens",
				column: "FamilyId");

			migrationBuilder.CreateIndex(
				name: "IX_RefreshTokens_TokenHash",
				schema: "Identity",
				table: "RefreshTokens",
				column: "TokenHash",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_RefreshTokens_UserId_IsRevoked",
				schema: "Identity",
				table: "RefreshTokens",
				columns: new[] { "UserId", "IsRevoked" });

			migrationBuilder.CreateIndex(
				name: "IX_SecurityRoles_Name",
				schema: "Identity",
				table: "SecurityRoles",
				column: "Name",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_UserRoles_RoleId",
				schema: "Identity",
				table: "UserRoles",
				column: "RoleId");

			migrationBuilder.CreateIndex(
				name: "IX_UserRoles_UserId_RoleId",
				schema: "Identity",
				table: "UserRoles",
				columns: new[] { "UserId", "RoleId" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_Users_CreateDate",
				schema: "Identity",
				table: "Users",
				column: "CreatedAt");

			migrationBuilder.CreateIndex(
				name: "IX_Users_Email",
				schema: "Identity",
				table: "Users",
				column: "Email",
				unique: true,
				filter: "\"IsDeleted\" = false");

			migrationBuilder.CreateIndex(
				name: "IX_Users_IsActive_CreateDate",
				schema: "Identity",
				table: "Users",
				columns: new[] { "IsActive", "CreatedAt" });

			migrationBuilder.CreateIndex(
				name: "IX_Users_IsDeleted",
				schema: "Identity",
				table: "Users",
				column: "IsDeleted");

			migrationBuilder.CreateIndex(
				name: "IX_Users_Username",
				schema: "Identity",
				table: "Users",
				column: "Username",
				unique: true,
				filter: "\"IsDeleted\" = false");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "EmailVerificationTokens",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "ExternalLogins",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "PasswordResetTokens",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "PermissionRequests",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "RefreshTokens",
				schema: "Identity");

			migrationBuilder.DropTable(
				name: "UserCredentials",
				schema: "Identity");

			migrationBuilder.DropTable(name: "UserRoles", schema: "Identity");

			migrationBuilder.DropTable(
				name: "SecurityRoles",
				schema: "Identity");

			migrationBuilder.DropTable(name: "Users", schema: "Identity");
		}
	}
}