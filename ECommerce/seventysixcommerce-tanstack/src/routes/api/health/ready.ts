import { now } from "@seventysixcommerce/shared/date";
import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";
import { db } from "~/server/db";

/**
 * Readiness probe — returns 200 only when the database is reachable.
 * Docker and orchestrators should use this for readiness checks, while
 * `/api/healthz` serves as the liveness probe.
 */
export const Route =
	createFileRoute("/api/health/ready")(
		{
			server: {
				handlers: {
					GET: async () =>
					{
						try
						{
							await db.execute(sql`SELECT 1`);

							return Response.json(
								{
									status: "ready",
									timestamp: now()
										.toISOString()
								},
								{ status: 200 });
						}
						catch
						{
							return Response.json(
								{
									status: "unavailable",
									timestamp: now()
										.toISOString()
								},
								{ status: 503 });
						}
					}
				}
			}
		});
