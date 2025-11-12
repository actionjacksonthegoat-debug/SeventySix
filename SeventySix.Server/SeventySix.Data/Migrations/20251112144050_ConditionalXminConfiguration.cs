using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeventySix.Data.Migrations
{
	/// <inheritdoc />
	public partial class ConditionalXminConfiguration : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			// No changes needed - xmin configuration is applied conditionally at runtime
			// For PostgreSQL: Maps to xmin system column (automatic)
			// For SQLite: Uses regular RowVersion column with default value
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// No changes needed - configuration is runtime-based, not schema-based
		}
	}
}
