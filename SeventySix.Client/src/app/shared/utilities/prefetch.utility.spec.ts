import { createTestQueryClient } from "@shared/testing";
import { createPrefetch } from "@shared/utilities/prefetch.utility";
import { QueryClient } from "@tanstack/angular-query-experimental";
import { vi } from "vitest";

describe("createPrefetch",
	() =>
	{
		let queryClient: QueryClient;

		beforeEach(
			() =>
			{
				queryClient =
					createTestQueryClient();
			});

		afterEach(
			() =>
			{
				queryClient.clear();
				vi.clearAllMocks();
			});

		it("should return a callable function",
			() =>
			{
				const mockQueryFn: () => Promise<string> =
					() => Promise.resolve("data");

				const prefetchFn: () => void =
					createPrefetch(
						queryClient,
						["test", "key"],
						mockQueryFn);

				expect(typeof prefetchFn)
					.toBe("function");
			});

		it("should call prefetchQuery when invoked",
			() =>
			{
				const prefetchSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(queryClient, "prefetchQuery");
				const mockQueryFn: () => Promise<string> =
					() => Promise.resolve("data");

				const prefetchFn: () => void =
					createPrefetch(
						queryClient,
						["test", "key"],
						mockQueryFn,
						60000);

				prefetchFn();

				expect(prefetchSpy)
					.toHaveBeenCalledWith(
						{
							queryKey: ["test", "key"],
							queryFn: mockQueryFn,
							staleTime: 60000
						});
			});

		it("should use default staleTime when not provided",
			() =>
			{
				const prefetchSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(queryClient, "prefetchQuery");
				const mockQueryFn: () => Promise<string> =
					() => Promise.resolve("data");

				const prefetchFn: () => void =
					createPrefetch(
						queryClient,
						["users", "single", 1],
						mockQueryFn);

				prefetchFn();

				expect(prefetchSpy)
					.toHaveBeenCalledWith(
						expect.objectContaining(
							{
								staleTime: 30000
							}));
			});

		it("should pass custom staleTime when provided",
			() =>
			{
				const prefetchSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(queryClient, "prefetchQuery");
				const mockQueryFn: () => Promise<string> =
					() => Promise.resolve("data");
				const customStaleTime: number = 120000;

				const prefetchFn: () => void =
					createPrefetch(
						queryClient,
						["users", "single", 1],
						mockQueryFn,
						customStaleTime);

				prefetchFn();

				expect(prefetchSpy)
					.toHaveBeenCalledWith(
						expect.objectContaining(
							{
								staleTime: customStaleTime
							}));
			});
	});
