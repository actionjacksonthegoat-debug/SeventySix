import { StorageService } from "./storage.service";
import { setupSimpleServiceTest } from "@testing";

describe("StorageService", () =>
{
	let service: StorageService;
	let consoleErrorSpy: jasmine.Spy;

	beforeEach(() =>
	{
		service = setupSimpleServiceTest(StorageService);
		localStorage.clear();
		consoleErrorSpy = spyOn(console, "error");
	});

	afterEach(() =>
	{
		try
		{
			localStorage.clear();
		}
		catch
		{
			// Ignore errors in cleanup
		}
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getItem", () =>
	{
		it("should return null for non-existent key", () =>
		{
			const value: string | null = service.getItem("non-existent");
			expect(value).toBeNull();
		});

		it("should retrieve string value", () =>
		{
			localStorage.setItem("test-string", "hello");
			const value: string | null = service.getItem<string>("test-string");
			expect(value).toBe("hello");
		});

		it("should retrieve and parse JSON object", () =>
		{
			const data = { name: "test", value: 123 };
			localStorage.setItem("test-object", JSON.stringify(data));
			const retrieved = service.getItem<typeof data>("test-object");
			expect(retrieved).toEqual(data);
		});

		it("should retrieve and parse JSON array", () =>
		{
			const data = [1, 2, 3];
			localStorage.setItem("test-array", JSON.stringify(data));
			const retrieved = service.getItem<number[]>("test-array");
			expect(retrieved).toEqual(data);
		});

		it("should return string if JSON parse fails", () =>
		{
			localStorage.setItem("test-invalid", "not-json-{{{");
			const value: string | null = service.getItem("test-invalid");
			expect(value).toBe("not-json-{{{");
		});

		it("should return null on localStorage error", () =>
		{
			spyOn(localStorage, "getItem").and.callFake(() =>
			{
				throw new Error("Storage error");
			});
			const value: string | null = service.getItem("error-key");
			expect(value).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("setItem", () =>
	{
		it("should store string value", () =>
		{
			const success: boolean = service.setItem("test-key", "test-value");
			expect(success).toBe(true);
			expect(localStorage.getItem("test-key")).toBe("test-value");
		});

		it("should store and stringify object", () =>
		{
			const data = { name: "test", value: 123 };
			const success: boolean = service.setItem("test-object", data);
			expect(success).toBe(true);
			const stored: string | null = localStorage.getItem("test-object");
			expect(JSON.parse(stored!)).toEqual(data);
		});

		it("should store and stringify array", () =>
		{
			const data = [1, 2, 3];
			const success: boolean = service.setItem("test-array", data);
			expect(success).toBe(true);
			const stored: string | null = localStorage.getItem("test-array");
			expect(JSON.parse(stored!)).toEqual(data);
		});

		it("should return false on quota exceeded error", () =>
		{
			const error = new DOMException(
				"Quota exceeded",
				"QuotaExceededError"
			);
			spyOn(localStorage, "setItem").and.callFake(() =>
			{
				throw error;
			});
			const success: boolean = service.setItem("test-key", "value");
			expect(success).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"StorageService: Quota exceeded"
			);
		});

		it("should return false on other storage errors", () =>
		{
			spyOn(localStorage, "setItem").and.callFake(() =>
			{
				throw new Error("Storage error");
			});
			const success: boolean = service.setItem("test-key", "value");
			expect(success).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("removeItem", () =>
	{
		it("should remove existing item", () =>
		{
			localStorage.setItem("test-key", "test-value");
			service.removeItem("test-key");
			expect(localStorage.getItem("test-key")).toBeNull();
		});

		it("should handle removing non-existent item", () =>
		{
			expect(() => service.removeItem("non-existent")).not.toThrow();
		});

		it("should handle localStorage errors silently", () =>
		{
			spyOn(localStorage, "removeItem").and.callFake(() =>
			{
				throw new Error("Storage error");
			});
			expect(() => service.removeItem("test-key")).not.toThrow();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("clear", () =>
	{
		it("should clear all items", () =>
		{
			localStorage.setItem("key1", "value1");
			localStorage.setItem("key2", "value2");
			service.clear();
			expect(localStorage.length).toBe(0);
		});

		it("should handle localStorage errors silently", () =>
		{
			spyOn(localStorage, "clear").and.callFake(() =>
			{
				throw new Error("Storage error");
			});
			expect(() => service.clear()).not.toThrow();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});
});
