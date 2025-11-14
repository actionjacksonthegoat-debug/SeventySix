import { getQueryConfig } from "./query-config";
import { environment } from "@environments/environment";

describe("getQueryConfig", () =>
{
	it("should return weather-specific config", () =>
	{
		const config = getQueryConfig("weather");

		expect(config.staleTime).toBe(
			environment.cache.query.weather.staleTime
		);
		expect(config.gcTime).toBe(environment.cache.query.weather.gcTime);
		expect(config.retry).toBe(environment.cache.query.weather.retry);
	});

	it("should return users-specific config", () =>
	{
		const config = getQueryConfig("users");

		expect(config.staleTime).toBe(environment.cache.query.users.staleTime);
		expect(config.gcTime).toBe(environment.cache.query.users.gcTime);
		expect(config.retry).toBe(environment.cache.query.users.retry);
	});

	it("should return logs-specific config", () =>
	{
		const config = getQueryConfig("logs");

		expect(config.staleTime).toBe(environment.cache.query.logs.staleTime);
		expect(config.gcTime).toBe(environment.cache.query.logs.gcTime);
		expect(config.retry).toBe(environment.cache.query.logs.retry);
	});

	it("should return health-specific config", () =>
	{
		const config = getQueryConfig("health");

		expect(config.staleTime).toBe(environment.cache.query.health.staleTime);
		expect(config.gcTime).toBe(environment.cache.query.health.gcTime);
		expect(config.retry).toBe(environment.cache.query.health.retry);
	});

	it("should return default config for unknown resource", () =>
	{
		const config = getQueryConfig("unknown");

		expect(config.staleTime).toBe(
			environment.cache.query.default.staleTime
		);
		expect(config.gcTime).toBe(environment.cache.query.default.gcTime);
		expect(config.retry).toBe(environment.cache.query.default.retry);
	});

	it("should handle empty string as unknown resource", () =>
	{
		const config = getQueryConfig("");

		expect(config.staleTime).toBe(
			environment.cache.query.default.staleTime
		);
		expect(config.gcTime).toBe(environment.cache.query.default.gcTime);
		expect(config.retry).toBe(environment.cache.query.default.retry);
	});

	it("should return complete QueryOptions object", () =>
	{
		const config = getQueryConfig("weather");

		expect(config.staleTime).toBeDefined();
		expect(config.gcTime).toBeDefined();
		expect(config.retry).toBeDefined();
		expect(typeof config.staleTime).toBe("number");
		expect(typeof config.gcTime).toBe("number");
		expect(typeof config.retry).toBe("number");
	});
});
