import { TestBed } from "@angular/core/testing";
import { setupSimpleServiceTest } from "@shared/testing";
import { vi } from "vitest";
import { StorageService } from "./storage.service";

/**
 * Creates a mock localStorage/sessionStorage that can throw errors.
 * jsdom's Storage implementation doesn't allow vi.spyOn to intercept calls,
 * so we need to replace the entire Storage object.
 *
 * @param {"getItem" | "setItem" | "removeItem" | "clear" | undefined} throwOnMethod
 * The method that should throw an error
 * @param {Error | undefined} errorToThrow
 * Optional custom error to throw
 * @returns {Storage}
 * A mock Storage object
 */
function createMockStorage(
	throwOnMethod?: "getItem" | "setItem" | "removeItem" | "clear",
	errorToThrow?: Error): Storage
{
	const store: Map<string, string> =
		new Map();

	return {
		get length(): number
		{
			return store.size;
		},
		key(index: number): string | null
		{
			return Array.from(store.keys())[index] ?? null;
		},
		getItem(key: string): string | null
		{
			if (throwOnMethod === "getItem")
			{
				throw errorToThrow ?? new Error("Storage error");
			}
			return store.get(key) ?? null;
		},
		setItem(key: string, value: string): void
		{
			if (throwOnMethod === "setItem")
			{
				throw errorToThrow ?? new Error("Storage error");
			}
			store.set(key, value);
		},
		removeItem(key: string): void
		{
			if (throwOnMethod === "removeItem")
			{
				throw errorToThrow ?? new Error("Storage error");
			}
			store.delete(key);
		},
		clear(): void
		{
			if (throwOnMethod === "clear")
			{
				throw errorToThrow ?? new Error("Storage error");
			}
			store.clear();
		}
	};
}

describe("StorageService",
	() =>
	{
		let service: StorageService;
		let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
		let originalLocalStorage: Storage;

		beforeEach(
			() =>
			{
				originalLocalStorage =
					window.localStorage;
				service =
					setupSimpleServiceTest(StorageService);
				localStorage.clear();
				consoleErrorSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(
							() =>
							{});
			});

		afterEach(
			() =>
			{
			// Restore original localStorage
				Object.defineProperty(
					window,
					"localStorage",
					{
						value: originalLocalStorage,
						writable: true
					});
				try
				{
					localStorage.clear();
				}
				catch
				{
				// Ignore errors in cleanup
				}
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("getItem",
			() =>
			{
				it("should return null for non-existent key",
					() =>
					{
						const value: string | null =
							service.getItem("non-existent");
						expect(value)
							.toBeNull();
					});

				it("should retrieve string value",
					() =>
					{
						localStorage.setItem("test-string", "hello");
						const value: string | null =
							service.getItem<string>("test-string");
						expect(value)
							.toBe("hello");
					});

				it("should retrieve and parse JSON object",
					() =>
					{
						const data: { name: string; value: number; } =
							{ name: "test", value: 123 };
						localStorage.setItem("test-object", JSON.stringify(data));
						const retrieved: { name: string; value: number; } | null =
							service.getItem<typeof data>("test-object");
						expect(retrieved)
							.toEqual(data);
					});

				it("should retrieve and parse JSON array",
					() =>
					{
						const data: number[] =
							[1, 2, 3];
						localStorage.setItem("test-array", JSON.stringify(data));

						const retrieved: number[] | null =
							service.getItem<number[]>("test-array");
						expect(retrieved)
							.toEqual(data);
					});

				it("should return string if JSON parse fails",
					() =>
					{
						localStorage.setItem("test-invalid", "not-json-{{{");
						const value: string | null =
							service.getItem("test-invalid");
						expect(value)
							.toBe("not-json-{{{");
					});

				it("should return null on localStorage error",
					() =>
					{
						const mockStorage: Storage =
							createMockStorage("getItem");
						Object.defineProperty(
							window,
							"localStorage",
							{
								value: mockStorage,
								writable: true
							});

						// Reset TestBed and create a new service instance to use the mocked localStorage
						TestBed.resetTestingModule();
						const errorService: StorageService =
							setupSimpleServiceTest(StorageService);
						const value: string | null =
							errorService.getItem("error-key");
						expect(value)
							.toBeNull();
						expect(consoleErrorSpy)
							.toHaveBeenCalled();
					});
			});

		describe("setItem",
			() =>
			{
				it("should store string value",
					() =>
					{
						const success: boolean =
							service.setItem("test-key", "test-value");
						expect(success)
							.toBe(true);
						expect(localStorage.getItem("test-key"))
							.toBe("test-value");
					});

				it("should store and stringify object",
					() =>
					{
						const data: { name: string; value: number; } =
							{ name: "test", value: 123 };
						const success: boolean =
							service.setItem("test-object", data);
						expect(success)
							.toBe(true);
						const stored: string | null =
							localStorage.getItem("test-object");
						expect(JSON.parse(stored!))
							.toEqual(data);
					});

				it("should store and stringify array",
					() =>
					{
						const data: number[] =
							[1, 2, 3];
						const success: boolean =
							service.setItem("test-array", data);
						expect(success)
							.toBe(true);
						const stored: string | null =
							localStorage.getItem("test-array");
						expect(JSON.parse(stored!))
							.toEqual(data);
					});

				it("should return false on quota exceeded error",
					() =>
					{
						const quotaError: DOMException =
							new DOMException(
								"Quota exceeded",
								"QuotaExceededError");
						const mockStorage: Storage =
							createMockStorage("setItem", quotaError);
						Object.defineProperty(
							window,
							"localStorage",
							{
								value: mockStorage,
								writable: true
							});

						// Reset TestBed and create a new service instance to use the mocked localStorage
						TestBed.resetTestingModule();
						const errorService: StorageService =
							setupSimpleServiceTest(StorageService);
						const success: boolean =
							errorService.setItem("test-key", "value");
						expect(success)
							.toBe(false);
						expect(consoleErrorSpy)
							.toHaveBeenCalledWith(
								"StorageService: Quota exceeded");
					});

				it("should return false on other storage errors",
					() =>
					{
						const mockStorage: Storage =
							createMockStorage("setItem");
						Object.defineProperty(
							window,
							"localStorage",
							{
								value: mockStorage,
								writable: true
							});

						// Reset TestBed and create a new service instance to use the mocked localStorage
						TestBed.resetTestingModule();
						const errorService: StorageService =
							setupSimpleServiceTest(StorageService);
						const success: boolean =
							errorService.setItem("test-key", "value");
						expect(success)
							.toBe(false);
						expect(consoleErrorSpy)
							.toHaveBeenCalled();
					});
			});

		describe("removeItem",
			() =>
			{
				it("should remove existing item",
					() =>
					{
						localStorage.setItem("test-key", "test-value");
						service.removeItem("test-key");
						expect(localStorage.getItem("test-key"))
							.toBeNull();
					});

				it("should handle removing non-existent item",
					() =>
					{
						expect(
							() => service.removeItem("non-existent"))
							.not
							.toThrow();
					});

				it("should handle localStorage errors silently",
					() =>
					{
						const mockStorage: Storage =
							createMockStorage("removeItem");
						Object.defineProperty(
							window,
							"localStorage",
							{
								value: mockStorage,
								writable: true
							});

						// Reset TestBed and create a new service instance to use the mocked localStorage
						TestBed.resetTestingModule();
						const errorService: StorageService =
							setupSimpleServiceTest(StorageService);
						expect(
							() =>
								errorService.removeItem("test-key"))
							.not
							.toThrow();
						expect(consoleErrorSpy)
							.toHaveBeenCalled();
					});
			});

		describe("clear",
			() =>
			{
				it("should clear all items",
					() =>
					{
						localStorage.setItem("key1", "value1");
						localStorage.setItem("key2", "value2");
						service.clear();
						expect(localStorage.length)
							.toBe(0);
					});

				it("should handle localStorage errors silently",
					() =>
					{
						const mockStorage: Storage =
							createMockStorage("clear");
						Object.defineProperty(
							window,
							"localStorage",
							{
								value: mockStorage,
								writable: true
							});

						// Reset TestBed and create a new service instance to use the mocked localStorage
						TestBed.resetTestingModule();
						const errorService: StorageService =
							setupSimpleServiceTest(StorageService);
						expect(
							() => errorService.clear())
							.not
							.toThrow();
						expect(consoleErrorSpy)
							.toHaveBeenCalled();
					});
			});
	});
