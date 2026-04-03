import { beforeEach, describe, expect, it, vi } from "vitest";

let themeModule: typeof import("$lib/stores/theme");

/** Stub for matchMedia to simulate prefers-color-scheme. */
function createMatchMediaStub(matches: boolean): (query: string) => MediaQueryList
{
	return (query: string): MediaQueryList =>
		({
			matches,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}) as unknown as MediaQueryList;
}
/** Creates a mock localStorage backed by a plain object. */
function createLocalStorageMock(): Storage
{
	const store: Record<string, string> = {};

	return {
		get length(): number
		{
			return Object.keys(store).length;
		},
		key(index: number): string | null
		{
			return Object.keys(store)[index] ?? null;
		},
		getItem(key: string): string | null
		{
			return store[key] ?? null;
		},
		setItem(key: string, value: string): void
		{
			store[key] = value;
		},
		removeItem(key: string): void
		{
			delete store[key];
		},
		clear(): void
		{
			for (const key of Object.keys(store))
			{
				delete store[key];
			}
		}
	};
}
describe("Theme Store",
	() =>
	{
		beforeEach(
			async () =>
			{
				vi.stubGlobal("localStorage", createLocalStorageMock());
				vi.stubGlobal("matchMedia", createMatchMediaStub(false));

				vi.stubGlobal("document",
					{
						documentElement: {
							classList: {
								_classes: new Set<string>(),
								add(cls: string): void
								{
									this._classes.add(cls);
								},
								remove(cls: string): void
								{
									this._classes.delete(cls);
								},
								contains(cls: string): boolean
								{
									return this._classes.has(cls);
								}
							}
						}
					});

				vi.resetModules();
				themeModule =
					await import("$lib/stores/theme");
			});

		it("initializes to light when no localStorage and no prefers-color-scheme",
			() =>
			{
				themeModule.initTheme();

				expect(themeModule.theme.current)
					.toBe("light");
				expect(themeModule.theme.isDark)
					.toBe(false);
			});

		it("reads from localStorage on init",
			async () =>
			{
				localStorage.setItem("SeventySixCommerce-theme", "dark");
				vi.resetModules();
				themeModule =
					await import("$lib/stores/theme");
				themeModule.initTheme();

				expect(themeModule.theme.current)
					.toBe("dark");
				expect(themeModule.theme.isDark)
					.toBe(true);
			});

		it("falls back to prefers-color-scheme when no localStorage",
			async () =>
			{
				vi.stubGlobal("matchMedia", createMatchMediaStub(true));
				vi.resetModules();
				themeModule =
					await import("$lib/stores/theme");
				themeModule.initTheme();

				expect(themeModule.theme.current)
					.toBe("dark");
			});

		it("toggleTheme switches from light to dark",
			() =>
			{
				themeModule.initTheme();
				themeModule.toggleTheme();

				expect(themeModule.theme.current)
					.toBe("dark");
				expect(themeModule.theme.isDark)
					.toBe(true);
			});

		it("toggleTheme switches from dark to light",
			async () =>
			{
				localStorage.setItem("SeventySixCommerce-theme", "dark");
				vi.resetModules();
				themeModule =
					await import("$lib/stores/theme");
				themeModule.initTheme();
				themeModule.toggleTheme();

				expect(themeModule.theme.current)
					.toBe("light");
				expect(themeModule.theme.isDark)
					.toBe(false);
			});

		it("toggleTheme persists to localStorage",
			() =>
			{
				themeModule.initTheme();
				themeModule.toggleTheme();

				expect(localStorage.getItem("SeventySixCommerce-theme"))
					.toBe("dark");
			});

		it("isDark is true when theme is dark",
			async () =>
			{
				localStorage.setItem("SeventySixCommerce-theme", "dark");
				vi.resetModules();
				themeModule =
					await import("$lib/stores/theme");
				themeModule.initTheme();

				expect(themeModule.theme.isDark)
					.toBe(true);
			});
	});