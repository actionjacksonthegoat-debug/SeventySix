import { describe, expect, it, vi } from "vitest";
import {
	callPrivateMethod,
	getPrivateProperty,
	mockNavigatorProperty,
	mockWindowProperty,
	setPrivateProperty,
	spyOnPrivateMethod
} from "./test-spy.utilities";

/**
 * Test class with private members for testing spy utilities.
 */
class TestClass
{
	private privateValue: number = 42;

	private privateMethod(multiplier: number): number
	{
		return this.privateValue * multiplier;
	}

	public publicMethod(): number
	{
		return this.privateMethod(2);
	}
}

describe("test-spy.utilities",
	() =>
	{
		describe("spyOnPrivateMethod",
			() =>
			{
				it("should create spy that wraps original method",
					() =>
					{
						const instance: TestClass =
							new TestClass();
						const spy: ReturnType<typeof vi.fn> =
							spyOnPrivateMethod(instance, "privateMethod");

						// Call through public method which uses private method
						const result: number =
							instance.publicMethod();

						expect(spy)
							.toHaveBeenCalledWith(2);
						expect(result)
							.toBe(84);
					});

				it("should throw error for non-existent method",
					() =>
					{
						const instance: TestClass =
							new TestClass();

						expect(() =>
							spyOnPrivateMethod(instance, "nonExistent"))
							.toThrow("Method \"nonExistent\" not found on object");
					});
			});

		describe("getPrivateProperty",
			() =>
			{
				it("should return private property value",
					() =>
					{
						const instance: TestClass =
							new TestClass();

						const value: number =
							getPrivateProperty<TestClass, number>(instance, "privateValue");

						expect(value)
							.toBe(42);
					});
			});

		describe("setPrivateProperty",
			() =>
			{
				it("should set private property value",
					() =>
					{
						const instance: TestClass =
							new TestClass();

						setPrivateProperty(instance, "privateValue", 100);
						const value: number =
							getPrivateProperty<TestClass, number>(instance, "privateValue");

						expect(value)
							.toBe(100);
					});
			});

		describe("callPrivateMethod",
			() =>
			{
				it("should call private method with arguments",
					() =>
					{
						const instance: TestClass =
							new TestClass();

						const result: number =
							callPrivateMethod<TestClass, number>(instance, "privateMethod", 3);

						expect(result)
							.toBe(126);
					});

				it("should throw error for non-existent method",
					() =>
					{
						const instance: TestClass =
							new TestClass();

						expect(() =>
							callPrivateMethod(instance, "nonExistent"))
							.toThrow("Method \"nonExistent\" not found on object");
					});
			});

		describe("mockNavigatorProperty",
			() =>
			{
				it("should mock navigator property",
					() =>
					{
						const spy: ReturnType<typeof vi.spyOn> =
							mockNavigatorProperty("userAgent", "MockedBrowser/1.0");

						expect(window.navigator.userAgent)
							.toBe("MockedBrowser/1.0");

						spy.mockRestore();
					});
			});

		describe("mockWindowProperty",
			() =>
			{
				it("should mock window property",
					() =>
					{
						const originalHeight: number =
							window.innerHeight;

						mockWindowProperty("innerHeight", 1000);

						expect(window.innerHeight)
							.toBe(1000);

						// Restore original value
						mockWindowProperty("innerHeight", originalHeight);
					});
			});
	});