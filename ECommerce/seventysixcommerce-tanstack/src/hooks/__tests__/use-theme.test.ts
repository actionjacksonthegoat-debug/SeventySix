import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "~/hooks/use-theme";

/** Creates a mock localStorage backed by an in-memory Map. */
function createLocalStorageMock(): Storage
{
	const store: Map<string, string> =
		new Map();
	return {
		getItem: (key: string): string | null =>
			store.get(key) ?? null,
		setItem: (key: string, value: string): void =>
		{
			store.set(key, value);
		},
		removeItem: (key: string): void =>
		{
			store.delete(key);
		},
		clear: (): void =>
		{
			store.clear();
		},
		get length(): number
		{
			return store.size;
		},
		key: (_index: number): string | null => null
	};
}

/** Creates a mock matchMedia that returns the given matches value. */
function createMatchMediaStub(matches: boolean): (query: string) => MediaQueryList
{
	return (_query: string): MediaQueryList =>
		({
			matches,
			media: _query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}) as MediaQueryList;
}

describe("useTheme",
	() =>
	{
		let originalLocalStorage: Storage;
		let originalMatchMedia: typeof window.matchMedia;

		beforeEach(
			() =>
			{
				originalLocalStorage =
					window.localStorage;
				originalMatchMedia =
					window.matchMedia;
				document.documentElement.classList.remove("dark");
			});

		afterEach(
			() =>
			{
				Object.defineProperty(window, "localStorage",
					{ value: originalLocalStorage, writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: originalMatchMedia, writable: true });
				document.documentElement.classList.remove("dark");
			});

		it("returns 'light' by default",
			() =>
			{
				Object.defineProperty(window, "localStorage",
					{ value: createLocalStorageMock(), writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(false), writable: true });

				const { result } =
					renderHook(() => useTheme());

				expect(result.current.theme)
					.toBe("light");
				expect(result.current.isDark)
					.toBe(false);
			});

		it("reads from localStorage",
			() =>
			{
				const mockStorage: Storage =
					createLocalStorageMock();
				mockStorage.setItem("SeventySixCommerce-theme", "dark");

				Object.defineProperty(window, "localStorage",
					{ value: mockStorage, writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(false), writable: true });

				const { result } =
					renderHook(() => useTheme());

				expect(result.current.theme)
					.toBe("dark");
				expect(result.current.isDark)
					.toBe(true);
			});

		it("falls back to prefers-color-scheme",
			() =>
			{
				Object.defineProperty(window, "localStorage",
					{ value: createLocalStorageMock(), writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(true), writable: true });

				const { result } =
					renderHook(() => useTheme());

				expect(result.current.theme)
					.toBe("dark");
				expect(result.current.isDark)
					.toBe(true);
			});

		it("toggleTheme switches from light to dark",
			() =>
			{
				Object.defineProperty(window, "localStorage",
					{ value: createLocalStorageMock(), writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(false), writable: true });

				const { result } =
					renderHook(() => useTheme());

				act(
					() =>
					{
						result.current.toggleTheme();
					});

				expect(result.current.theme)
					.toBe("dark");
				expect(result.current.isDark)
					.toBe(true);
				expect(document.documentElement.classList.contains("dark"))
					.toBe(true);
			});

		it("toggleTheme persists to localStorage",
			() =>
			{
				const mockStorage: Storage =
					createLocalStorageMock();

				Object.defineProperty(window, "localStorage",
					{ value: mockStorage, writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(false), writable: true });

				const { result } =
					renderHook(() => useTheme());

				act(
					() =>
					{
						result.current.toggleTheme();
					});

				expect(mockStorage.getItem("SeventySixCommerce-theme"))
					.toBe("dark");
			});

		it("isDark is true when theme is dark",
			() =>
			{
				const mockStorage: Storage =
					createLocalStorageMock();
				mockStorage.setItem("SeventySixCommerce-theme", "dark");

				Object.defineProperty(window, "localStorage",
					{ value: mockStorage, writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(false), writable: true });

				const { result } =
					renderHook(() => useTheme());

				expect(result.current.isDark)
					.toBe(true);

				act(
					() =>
					{
						result.current.toggleTheme();
					});

				expect(result.current.isDark)
					.toBe(false);
			});

		it("sets theme cookie on toggleTheme",
			() =>
			{
				Object.defineProperty(window, "localStorage",
					{ value: createLocalStorageMock(), writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(false), writable: true });

				const { result } =
					renderHook(() => useTheme());

				act(
					() =>
					{
						result.current.toggleTheme();
					});

				expect(document.cookie)
					.toContain("ssxc-theme=dark");
			});

		it("sets theme cookie on setTheme",
			() =>
			{
				Object.defineProperty(window, "localStorage",
					{ value: createLocalStorageMock(), writable: true });
				Object.defineProperty(window, "matchMedia",
					{ value: createMatchMediaStub(false), writable: true });

				const { result } =
					renderHook(() => useTheme());

				act(
					() =>
					{
						result.current.setTheme("dark");
					});

				expect(document.cookie)
					.toContain("ssxc-theme=dark");
			});
	});