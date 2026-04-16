import { now } from "@seventysixcommerce/shared/date";
import { createFileRoute } from "@tanstack/react-router";

/** Health check endpoint — returns 200 with timestamp for Docker HEALTHCHECK. */
export const Route =
	createFileRoute("/api/healthz")(
		{
			server: {
				handlers: {
					GET: async () =>
					{
						return Response.json(
							{
								status: "healthy",
								timestamp: now()
									.toISOString()
							});
					}
				}
			}
		});