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

	// Always override matchMedia to guarantee consistent behavior across all
	// environments. happy-dom on Linux CI may expose a native matchMedia but
	// return mql objects missing addListener/removeListener, which Angular CDK
	// BreakpointObserver requires (deprecated API still used as a fallback).
	Object.defineProperty(
		window,
		"matchMedia",
		{
			writable: true,
			configurable: true,
			value: vi
				.fn()
				.mockImplementation(
					(query: string) => ({
						matches: false,
						media: query,
						onchange: null,
						// Required by Angular CDK BreakpointObserver (deprecated fallback path)
						addListener: vi.fn(),
						removeListener: vi.fn(),
						addEventListener: vi.fn(),
						removeEventListener: vi.fn(),
						dispatchEvent: vi.fn()
					}))
		});

	// Always override ResizeObserver — happy-dom's implementation on Linux CI
	// may lack 'unobserve', causing Angular CDK ContentObserver to throw
	// an UnsubscriptionError during component cleanup.
	window.ResizeObserver =
		class MockResizeObserver
		{
			constructor(_callback?: ResizeObserverCallback)
			{
			// Accept callback to match real ResizeObserver constructor signature
			}

			observe: () => void =
				vi.fn();
			unobserve: () => void =
				vi.fn();
			disconnect: () => void =
				vi.fn();
		};
}

setupTestBed(
	{
		zoneless: true
	});