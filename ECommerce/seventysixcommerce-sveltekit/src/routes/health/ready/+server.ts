import { db } from "$lib/server/db";
import { now } from "@seventysixcommerce/shared/date";
import { sql } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Readiness probe — returns 200 only when the database is reachable.
 * Docker and orchestrators should use this for readiness checks, while
 * `/healthz` serves as the liveness probe.
 */
export const GET: RequestHandler =
	async () =>
	{
		try
		{
			await db.execute(sql`SELECT 1`);

			return new Response(
				JSON.stringify(
					{
						status: "ready",
						timestamp: now()
							.toISOString()
					}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" }
				});
		}
		catch
		{
			return new Response(
				JSON.stringify(
					{
						status: "unavailable",
						timestamp: now()
							.toISOString()
					}),
				{
					status: 503,
					headers: { "Content-Type": "application/json" }
				});
		}
	};
