import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCookie: ReturnType<typeof vi.fn> =
	vi.fn();
const mockSetCookie: ReturnType<typeof vi.fn> =
	vi.fn();
const mockNext: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockResolvedValue(
			{ context: {} });

vi.mock("@tanstack/react-start", () => (
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

vi.mock("@tanstack/react-start/server", () => (
	{
		getCookie: mockGetCookie,
		setCookie: mockSetCookie
	}));

vi.mock("~/lib/constants", () => (
	{
		CART_SESSION_COOKIE: "cart_session",
		CART_SESSION_MAX_AGE_SECONDS: 2592000
	}));

describe("TanStack cart session cookie security flags",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				vi.resetModules();
				mockGetCookie.mockReturnValue(undefined);
				mockNext.mockResolvedValue(
					{ context: { cartSessionId: "test-session" } });
			});

		it("sessionCookie_HasSecureFlag_InProduction",
			async () =>
			{
				const savedEnv: string | undefined =
					process.env.NODE_ENV;

				process.env.NODE_ENV = "production";

				try
				{
					const { cartSessionMiddleware } =
						await import("../server/middleware/cart-session");

					const serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown> =
						(cartSessionMiddleware as unknown as {
							_serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown>;
						})
							._serverFn;

					await serverFn(
						{ next: mockNext });

					const cookieOptions: Record<string, unknown> =
						mockSetCookie.mock.calls[0][2] as Record<string, unknown>;

					expect(cookieOptions.secure)
						.toBe(true);
				}
				finally
				{
					process.env.NODE_ENV = savedEnv;
				}
			});

		it("sessionCookie_HasSecureFlagFalse_InDev",
			async () =>
			{
				const savedEnv: string | undefined =
					process.env.NODE_ENV;

				process.env.NODE_ENV = "development";

				try
				{
					const { cartSessionMiddleware } =
						await import("../server/middleware/cart-session");

					const serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown> =
						(cartSessionMiddleware as unknown as {
							_serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown>;
						})
							._serverFn;

					await serverFn(
						{ next: mockNext });

					const cookieOptions: Record<string, unknown> =
						mockSetCookie.mock.calls[0][2] as Record<string, unknown>;

					expect(cookieOptions.secure)
						.toBe(false);
				}
				finally
				{
					process.env.NODE_ENV = savedEnv;
				}
			});

		it("sessionCookie_HasHttpOnlyTrue",
			async () =>
			{
				const { cartSessionMiddleware } =
					await import("../server/middleware/cart-session");

				const serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown> =
					(cartSessionMiddleware as unknown as { _serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown>; })
						._serverFn;

				await serverFn(
					{ next: mockNext });

				const cookieOptions: Record<string, unknown> =
					mockSetCookie.mock.calls[0][2] as Record<string, unknown>;

				expect(cookieOptions.httpOnly)
					.toBe(true);
			});

		it("sessionCookie_HasSameSiteLax",
			async () =>
			{
				const { cartSessionMiddleware } =
					await import("../server/middleware/cart-session");

				const serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown> =
					(cartSessionMiddleware as unknown as { _serverFn: (opts: { next: typeof mockNext; }) => Promise<unknown>; })
						._serverFn;

				await serverFn(
					{ next: mockNext });

				const cookieOptions: Record<string, unknown> =
					mockSetCookie.mock.calls[0][2] as Record<string, unknown>;

				expect(cookieOptions.sameSite)
					.toBe("lax");
			});
	});