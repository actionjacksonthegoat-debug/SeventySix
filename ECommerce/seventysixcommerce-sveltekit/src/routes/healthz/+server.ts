import { now } from "$lib/utils/date";
import type { RequestHandler } from "./$types";

/** Health check endpoint for Docker and monitoring. */
export const GET: RequestHandler =
	async () =>
	{
		return new Response(
			JSON.stringify(
				{
					status: "ok",
					timestamp: now()
						.toISOString()
				}),
			{ headers: { "Content-Type": "application/json" } });
	};