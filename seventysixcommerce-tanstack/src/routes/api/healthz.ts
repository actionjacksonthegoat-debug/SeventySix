import { createFileRoute } from "@tanstack/react-router";
import { now } from "~/lib/date";

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