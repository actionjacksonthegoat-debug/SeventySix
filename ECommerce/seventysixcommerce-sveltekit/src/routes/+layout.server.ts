import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { cartItems } from "$lib/server/db/schema";
import { eq, sum } from "drizzle-orm";
import type { LayoutServerLoad } from "./$types";

/** Root layout server load — provides cart count, mock mode flag, base URL, and OTEL endpoint to all pages. */
export const load: LayoutServerLoad =
	async ({ locals }) =>
	{
		const result: { total: string | null; }[] =
			await db
				.select(
					{ total: sum(cartItems.quantity) })
				.from(cartItems)
				.where(eq(cartItems.sessionId, locals.cartSessionId));

		const cartCount: number =
			Number(result[0]?.total ?? 0);
		const mockMode: boolean =
			env.MOCK_SERVICES !== "false";
		const otelEndpoint: string =
			env.PUBLIC_OTEL_ENDPOINT ?? "";
		const ga4MeasurementId: string =
			env.PUBLIC_GA4_MEASUREMENT_ID ?? "";
		const googleSiteVerification: string =
			env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? "";
		const bingSiteVerification: string =
			env.PUBLIC_BING_SITE_VERIFICATION ?? "";

		return {
			cartCount,
			mockMode,
			baseUrl: env.BASE_URL ?? "",
			otelEndpoint,
			ga4MeasurementId,
			googleSiteVerification,
			bingSiteVerification
		};
	};