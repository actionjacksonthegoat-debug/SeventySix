/**
 * Material Bundles Tests
 * Validates Material module bundle exports for consistency.
 */

import { Type } from "@angular/core";
import {
	CARD_MATERIAL_MODULES,
	DIALOG_MATERIAL_MODULES,
	FORM_MATERIAL_MODULES,
	NAVIGATION_MATERIAL_MODULES,
	STEPPER_MATERIAL_MODULES,
	TABLE_MATERIAL_MODULES
} from "@shared/material-bundles";

describe("Material Bundles",
	() =>
	{
		it("should export FORM_MATERIAL_MODULES as readonly array",
			() =>
			{
				expect(FORM_MATERIAL_MODULES)
					.toBeDefined();
				expect(Array.isArray(FORM_MATERIAL_MODULES))
					.toBe(true);
				expect(FORM_MATERIAL_MODULES.length)
					.toBeGreaterThan(0);
			});

		it("should export TABLE_MATERIAL_MODULES as readonly array",
			() =>
			{
				expect(TABLE_MATERIAL_MODULES)
					.toBeDefined();
				expect(Array.isArray(TABLE_MATERIAL_MODULES))
					.toBe(true);
				expect(TABLE_MATERIAL_MODULES.length)
					.toBeGreaterThan(0);
			});

		it("should export DIALOG_MATERIAL_MODULES as readonly array",
			() =>
			{
				expect(DIALOG_MATERIAL_MODULES)
					.toBeDefined();
				expect(Array.isArray(DIALOG_MATERIAL_MODULES))
					.toBe(true);
				expect(DIALOG_MATERIAL_MODULES.length)
					.toBeGreaterThan(0);
			});

		it("should export NAVIGATION_MATERIAL_MODULES as readonly array",
			() =>
			{
				expect(NAVIGATION_MATERIAL_MODULES)
					.toBeDefined();
				expect(Array.isArray(NAVIGATION_MATERIAL_MODULES))
					.toBe(true);
				expect(NAVIGATION_MATERIAL_MODULES.length)
					.toBeGreaterThan(0);
			});

		it("should export STEPPER_MATERIAL_MODULES as readonly array",
			() =>
			{
				expect(STEPPER_MATERIAL_MODULES)
					.toBeDefined();
				expect(Array.isArray(STEPPER_MATERIAL_MODULES))
					.toBe(true);
				expect(STEPPER_MATERIAL_MODULES.length)
					.toBeGreaterThan(0);
			});

		it("should export CARD_MATERIAL_MODULES as readonly array",
			() =>
			{
				expect(CARD_MATERIAL_MODULES)
					.toBeDefined();
				expect(Array.isArray(CARD_MATERIAL_MODULES))
					.toBe(true);
				expect(CARD_MATERIAL_MODULES.length)
					.toBeGreaterThan(0);
			});

		it("FORM_MATERIAL_MODULES should include form essentials",
			() =>
			{
				const moduleNames: string[] =
					FORM_MATERIAL_MODULES.map(
						(module: Type<unknown>) =>
							module.name ?? "");

				// Should include core form modules
				expect(moduleNames.some(
					(name: string) =>
						name.includes("FormField")))
					.toBe(true);
				expect(moduleNames.some(
					(name: string) => name.includes("Input")))
					.toBe(true);
				expect(moduleNames.some(
					(name: string) =>
						name.includes("Button")))
					.toBe(true);
			});

		it("TABLE_MATERIAL_MODULES should include table essentials",
			() =>
			{
				const moduleNames: string[] =
					TABLE_MATERIAL_MODULES.map(
						(module: Type<unknown>) =>
							module.name ?? "");

				// Should include core table modules
				expect(moduleNames.some(
					(name: string) => name.includes("Table")))
					.toBe(true);
				expect(moduleNames.some(
					(name: string) =>
						name.includes("Paginator")))
					.toBe(true);
				expect(moduleNames.some(
					(name: string) => name.includes("Sort")))
					.toBe(true);
			});
	});
