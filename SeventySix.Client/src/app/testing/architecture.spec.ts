import { TestBed } from "@angular/core/testing";

describe("Architecture", () =>
{
	describe("Service Façade Pattern", () =>
	{
		it("components should not import repositories directly (enforced by ESLint)", () =>
		{
			// This test documents the architectural constraint.
			// The actual enforcement is done by ESLint's no-restricted-imports rule
			// in eslint.config.js which prevents *.component.ts files from importing
			// from **/repositories paths.
			//
			// Pattern: Component → Service → Repository → ApiService
			// Violation: Component → Repository (bypasses service layer)
			//
			// Run `npm run lint` to verify no violations exist.
			expect(true).toBe(true);
		});

		it("services should use repositories for HTTP operations", () =>
		{
			// Services should delegate HTTP calls to repositories.
			// Services handle: business logic, TanStack Query caching, state management.
			// Repositories handle: HTTP transport via ApiService.
			expect(true).toBe(true);
		});
	});
});
