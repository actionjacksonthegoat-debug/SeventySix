// <copyright file="mock-service.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { describe, expect, it } from "vitest";

import { mockService } from "./mock-service";

interface SampleService
{
	read(id: string): string;
	write(id: string, value: string): void;
	clear(): void;
}

describe("mockService",
	() =>
	{
		it("creates a mock with every listed method bound as vi.fn",
			() =>
			{
				const mock: ReturnType<typeof mockService<SampleService>> =
					mockService<SampleService>(
						["read", "write", "clear"]);

				expect(typeof mock.read)
					.toBe("function");
				expect(typeof mock.write)
					.toBe("function");
				expect(typeof mock.clear)
					.toBe("function");

				mock.read.mockReturnValue("abc");

				expect(mock.read("k1"))
					.toBe("abc");
				expect(mock.read)
					.toHaveBeenCalledWith("k1");
			});

		it("omits methods that are not in the list",
			() =>
			{
				const mock: ReturnType<typeof mockService<SampleService>> =
					mockService<SampleService>(
						["read"]);

				expect("read" in mock)
					.toBe(true);
				expect("write" in mock)
					.toBe(false);
				expect("clear" in mock)
					.toBe(false);
			});

		it("records call arguments on each invocation",
			() =>
			{
				const mock: ReturnType<typeof mockService<SampleService>> =
					mockService<SampleService>(
						["write"]);

				mock.write("k1", "v1");
				mock.write("k2", "v2");

				expect(mock.write)
					.toHaveBeenCalledTimes(2);
				expect(mock.write)
					.toHaveBeenNthCalledWith(1, "k1", "v1");
				expect(mock.write)
					.toHaveBeenNthCalledWith(2, "k2", "v2");
			});
	});