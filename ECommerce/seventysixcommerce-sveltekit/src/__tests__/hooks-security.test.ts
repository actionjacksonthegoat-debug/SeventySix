import { beforeEach, describe, expect, it, vi } from "vitest";
import { handle } from "../hooks.server";

const mockCookiesSet: ReturnType<typeof vi.fn> =
	vi.fn();
const mockCookiesGet: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockReturnValue("existing-session-uuid");
const mockResolve: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockResolvedValue(
			new Response("ok",
				{ status: 200, headers: { "Content-Type": "text/html" } }));

vi.mock(
	"$app/environment",
	() => (
		{
			dev: false
		}));

vi.mock(
	"$env/dynamic/private",
	() => (
		{
			env: {
				SEVENTYSIX_API_URL: "",
				OTEL_EXPORTER_OTLP_ENDPOINT: ""
			}
		}));

vi.mock(
	"$lib/constants",
	() => (
		{
			CART_SESSION_COOKIE: "cart_session",
			CART_SESSION_MAX_AGE_SECONDS: 2592000
		}));

vi.mock(
	"$lib/server/log-forwarder",
	() => (
		{
			configureLogForwarder: vi.fn(),
			queueLog: vi.fn()
		}));

vi.mock(
	"$lib/server/telemetry",
	() => (
		{
			initTelemetry: vi.fn()
		}));

vi.mock(
	"@seventysixcommerce/shared/observability",
	() => (
		{
			generateTraceContext: vi
				.fn()
				.mockReturnValue(
					{ traceId: "trace-001", spanId: "span-001" }),
			parseTraceparent: vi
				.fn()
				.mockReturnValue(null)
		}));

vi.mock(
	"@seventysixcommerce/shared/logging",
	() => (
		{
			toSafeLogPayload: vi.fn()
		}));

/** Builds a minimal SvelteKit-like event for security header tests. */
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

describe("SvelteKit server hooks — security headers",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				mockCookiesGet.mockReturnValue("existing-session-uuid");
				mockResolve.mockResolvedValue(
					new Response("ok",
						{ status: 200 }));
			});

		it("handle_SetsXContentTypeOptionsNosniff",
			async () =>
			{
				const response: Response =
					await handle(
						{
							event: buildMockEvent() as never,
							resolve: mockResolve as never
						});

				expect(response.headers.get("X-Content-Type-Options"))
					.toBe("nosniff");
			});

		it("handle_SetsXFrameOptionsDeny",
			async () =>
			{
				const response: Response =
					await handle(
						{
							event: buildMockEvent() as never,
							resolve: mockResolve as never
						});

				expect(response.headers.get("X-Frame-Options"))
					.toBe("DENY");
			});

		it("handle_SetsReferrerPolicyStrictOriginWhenCrossOrigin",
			async () =>
			{
				const response: Response =
					await handle(
						{
							event: buildMockEvent() as never,
							resolve: mockResolve as never
						});

				expect(response.headers.get("Referrer-Policy"))
					.toBe("strict-origin-when-cross-origin");
			});

		it("handle_SetsCacheControlNoStore",
			async () =>
			{
				const response: Response =
					await handle(
						{
							event: buildMockEvent() as never,
							resolve: mockResolve as never
						});

				expect(response.headers.get("Cache-Control"))
					.toBe("no-store");
			});
	});