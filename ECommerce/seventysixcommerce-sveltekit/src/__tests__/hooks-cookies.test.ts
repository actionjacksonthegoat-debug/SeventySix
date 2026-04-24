import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConfigureLogForwarder: ReturnType<typeof vi.fn> =
	vi.fn();
const mockInitTelemetry: ReturnType<typeof vi.fn> =
	vi.fn();
const mockGenerateTraceContext: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockReturnValue(
			{ traceId: "trace-abc", spanId: "span-def" });
const mockParseTraceparent: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockReturnValue(null);
const mockCookiesSet: ReturnType<typeof vi.fn> =
	vi.fn();
const mockCookiesGet: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockReturnValue(undefined);
const mockResolve: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockResolvedValue(
			new Response("ok",
				{ headers: { "Content-Type": "text/html" } }));

vi.mock("$lib/constants", () => (
	{
		CART_SESSION_COOKIE: "cart_session",
		CART_SESSION_MAX_AGE_SECONDS: 2592000
	}));

vi.mock("$lib/server/log-forwarder", () => (
	{
		configureLogForwarder: mockConfigureLogForwarder,
		queueLog: vi.fn()
	}));

vi.mock("$lib/server/telemetry", () => (
	{
		initTelemetry: mockInitTelemetry
	}));

vi.mock("@seventysixcommerce/shared/observability", () => (
	{
		generateTraceContext: mockGenerateTraceContext,
		parseTraceparent: mockParseTraceparent
	}));

vi.mock("@seventysixcommerce/shared/logging", () => (
	{
		toSafeLogPayload: vi.fn()
	}));

/** Builds a minimal SvelteKit-like event for testing cookie behaviour. */
function buildMockEvent(): Record<string, unknown>
{
	return {
		cookies: {
			get: mockCookiesGet,
			set: mockCookiesSet
		},
		request: {
			headers: {
				get: vi
					.fn()
					.mockReturnValue(null)
			}
		},
		locals: {},
		url: { pathname: "/" }
	};
}

describe("SvelteKit cart session cookie security flags",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				vi.resetModules();
				mockCookiesGet.mockReturnValue(undefined);
				mockResolve.mockResolvedValue(
					new Response("ok",
						{ headers: { "Content-Type": "text/html" } }));
			});

		it("sessionCookie_HasSecureFlag_InProduction",
			async () =>
			{
				vi.doMock("$app/environment", () => ({ dev: false }));
				vi.doMock("$env/dynamic/private", () => (
					{
						env: {
							SEVENTYSIX_API_URL: "http://localhost:7074",
							OTEL_EXPORTER_OTLP_ENDPOINT: ""
						}
					}));

				const { handle } =
					await import("../hooks.server");

				await handle(
					{ event: buildMockEvent() as never, resolve: mockResolve as never });

				const cookieOptions: Record<string, unknown> =
					mockCookiesSet.mock.calls[0][2] as Record<string, unknown>;

				expect(cookieOptions.secure)
					.toBe(true);
			});

		it("sessionCookie_HasSecureFlagFalse_InDev",
			async () =>
			{
				vi.doMock("$app/environment", () => ({ dev: true }));
				vi.doMock("$env/dynamic/private", () => (
					{
						env: {
							SEVENTYSIX_API_URL: "http://localhost:7074",
							OTEL_EXPORTER_OTLP_ENDPOINT: ""
						}
					}));

				const { handle } =
					await import("../hooks.server");

				await handle(
					{ event: buildMockEvent() as never, resolve: mockResolve as never });

				const cookieOptions: Record<string, unknown> =
					mockCookiesSet.mock.calls[0][2] as Record<string, unknown>;

				expect(cookieOptions.secure)
					.toBe(false);
			});

		it("sessionCookie_HasHttpOnlyTrue",
			async () =>
			{
				vi.doMock("$app/environment", () => ({ dev: false }));
				vi.doMock("$env/dynamic/private", () => (
					{
						env: {
							SEVENTYSIX_API_URL: "http://localhost:7074",
							OTEL_EXPORTER_OTLP_ENDPOINT: ""
						}
					}));

				const { handle } =
					await import("../hooks.server");

				await handle(
					{ event: buildMockEvent() as never, resolve: mockResolve as never });

				const cookieOptions: Record<string, unknown> =
					mockCookiesSet.mock.calls[0][2] as Record<string, unknown>;

				expect(cookieOptions.httpOnly)
					.toBe(true);
			});

		it("sessionCookie_HasSameSiteLax",
			async () =>
			{
				vi.doMock("$app/environment", () => ({ dev: false }));
				vi.doMock("$env/dynamic/private", () => (
					{
						env: {
							SEVENTYSIX_API_URL: "http://localhost:7074",
							OTEL_EXPORTER_OTLP_ENDPOINT: ""
						}
					}));

				const { handle } =
					await import("../hooks.server");

				await handle(
					{ event: buildMockEvent() as never, resolve: mockResolve as never });

				const cookieOptions: Record<string, unknown> =
					mockCookiesSet.mock.calls[0][2] as Record<string, unknown>;

				expect(cookieOptions.sameSite)
					.toBe("lax");
			});
	});