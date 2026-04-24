import { beforeEach, describe, expect, it, vi } from "vitest";
import { csrfMiddleware } from "../../../server/middleware/csrf";

/** Hoisted so the vi.mock factory for @tanstack/react-start/server can reference it. */
const mockGetRequest: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());
const mockNext: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockResolvedValue(undefined);

vi.mock(
	"@tanstack/react-start",
	() => (
		{
			createMiddleware: vi
				.fn()
				.mockImplementation(
					() => (
						{
							server: (fn: unknown) => (
								{
									_serverFn: fn,
									server: (fn2: unknown) => (
										{ _serverFn: fn2 })
								})
						}))
		}));

vi.mock(
	"@tanstack/react-start/server",
	() => (
		{
			getRequest: mockGetRequest
		}));

/** Extracts the server function from the csrf middleware for direct invocation. */
function getServerFn(): (opts: { next: typeof mockNext; }) => Promise<unknown>
{
	return (csrfMiddleware as unknown as {
		_serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown>;
	})
		._serverFn;
}

describe("csrfMiddleware",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				process.env.BASE_URL = "https://localhost:3002";
				mockNext.mockResolvedValue(undefined);
			});

		it("csrfMiddleware_AllowsGetRequest_WithoutOriginCheck",
			async () =>
			{
				mockGetRequest.mockReturnValue(
					new Request(
						"https://localhost:3002/api/test",
						{ method: "GET" }));

				await getServerFn()(
					{ next: mockNext });

				expect(mockNext)
					.toHaveBeenCalledOnce();
			});

		it("csrfMiddleware_AllowsHeadRequest_WithoutOriginCheck",
			async () =>
			{
				mockGetRequest.mockReturnValue(
					new Request(
						"https://localhost:3002/api/test",
						{ method: "HEAD" }));

				await getServerFn()(
					{ next: mockNext });

				expect(mockNext)
					.toHaveBeenCalledOnce();
			});

		it("csrfMiddleware_RejectsPostRequest_WithNoOriginHeader",
			async () =>
			{
				mockGetRequest.mockReturnValue(
					new Request(
						"https://localhost:3002/api/cart",
						{ method: "POST" }));

				const result: Response =
					await getServerFn()(
						{ next: mockNext }) as Response;

				expect(result.status)
					.toBe(403);
				expect(mockNext)
					.not
					.toHaveBeenCalled();
			});

		it("csrfMiddleware_RejectsPostRequest_WithWrongOrigin",
			async () =>
			{
				mockGetRequest.mockReturnValue(
					new Request(
						"https://localhost:3002/api/cart",
						{
							method: "POST",
							headers: { origin: "https://evil.example.com" }
						}));

				const result: Response =
					await getServerFn()(
						{ next: mockNext }) as Response;

				expect(result.status)
					.toBe(403);
				expect(mockNext)
					.not
					.toHaveBeenCalled();
			});

		it("csrfMiddleware_AllowsPostRequest_WithMatchingOrigin",
			async () =>
			{
				mockGetRequest.mockReturnValue(
					new Request(
						"https://localhost:3002/api/cart",
						{
							method: "POST",
							headers: { origin: "https://localhost:3002" }
						}));

				await getServerFn()(
					{ next: mockNext });

				expect(mockNext)
					.toHaveBeenCalledOnce();
			});
	});