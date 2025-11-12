using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Data.Migrations
{
	/// <inheritdoc />
	public partial class UseXminForConcurrency : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			// No changes needed - xmin is a PostgreSQL system column that already exists
			// We're just configuring EF Core to use it for optimistic concurrency control
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// No changes needed - xmin is a system column and cannot be dropped
		}
	}
}
