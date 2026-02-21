import "@angular/compiler";
import "@analogjs/vitest-angular/setup-snapshots";
import { setupTestBed } from "@analogjs/vitest-angular/setup-testbed";
import { vi } from "vitest";

vi.mock("@environments/environment",
	async () =>
	{
		const testEnv: typeof import("./environments/environment.test") =
			await import("./environments/environment.test");
		return testEnv;
	});

if (typeof window !== "undefined")
{
	if (typeof window.confirm === "undefined")
	{
		window.confirm =
			(): boolean => true;
	}
	if (typeof window.alert === "undefined")
	{
		window.alert =
			(): void =>
			{};
	}

	// Mock window.open to prevent navigation during tests
	window.open =
		vi.fn();

	// Mock window.matchMedia for test environments that lack it natively.
	// Uses the modern addEventListener/removeEventListener API only.
	// No deprecated addListener/removeListener.
	if (typeof window.matchMedia === "undefined")
	{
		Object.defineProperty(
			window,
			"matchMedia",
			{
				writable: true,
				value: vi
					.fn()
					.mockImplementation(
						(query: string) => ({
							matches: false,
							media: query,
							onchange: null,
							addEventListener: vi.fn(),
							removeEventListener: vi.fn(),
							dispatchEvent: vi.fn()
						}))
			});
	}
}

setupTestBed(
	{
		zoneless: true
	});