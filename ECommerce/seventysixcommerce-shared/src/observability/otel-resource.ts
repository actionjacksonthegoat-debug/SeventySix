/**
 * Shared OpenTelemetry resource attribute builder for commerce apps.
 * Mirrors server-side `OtelResourceBuilder` to ensure a uniform
 * identity across all SeventySix services.
 *
 * @module otel-resource
 */

import { type Resource, resourceFromAttributes } from "@opentelemetry/resources";

/** The OpenTelemetry namespace shared by all SeventySix services. */
const SERVICE_NAMESPACE: string = "seventysix";

/** Configuration for building an OTel resource. */
export interface OtelResourceOptions
{
	/** Logical service name (e.g. `seventysixcommerce-sveltekit-browser`). */
	serviceName: string;

	/** Deployment environment name (e.g. `development`, `production`). */
	environment?: string;
}

/**
 * Builds an OpenTelemetry {@link Resource} with the standard SeventySix
 * resource attributes: `service.name`, `service.namespace`, and
 * `deployment.environment`.
 *
 * @param options - Service identification options.
 * @returns A configured OTel resource.
 */
export function buildResource(options: OtelResourceOptions): Resource
{
	const attributes: Record<string, string> =
		{
			"service.name": options.serviceName,
			"service.namespace": SERVICE_NAMESPACE,
		};

	if (options.environment !== undefined)
	{
		attributes["deployment.environment"] =
			options.environment;
	}

	return resourceFromAttributes(attributes);
}