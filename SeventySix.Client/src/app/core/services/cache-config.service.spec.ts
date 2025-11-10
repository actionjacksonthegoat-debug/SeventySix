import { TestBed } from "@angular/core/testing";
import { CacheConfigService } from "./cache-config.service";
import { provideZonelessChangeDetection } from "@angular/core";

describe("CacheConfigService", () =>
{
	let service: CacheConfigService;
	let fetchSpy: jasmine.Spy;

	const mockConfig = {
		dataGroups: [
			{
				name: "api-weather",
				urls: ["/weatherforecast", "/api/weather/**"],
				cacheConfig: {
					strategy: "freshness" as const,
					maxSize: 50,
					maxAge: "5m",
					timeout: "5s"
				}
			},
			{
				name: "api-reference-data",
				urls: ["/api/reference/**", "/api/config/**", "/api/lookup/**"],
				cacheConfig: {
					strategy: "performance" as const,
					maxSize: 100,
					maxAge: "1h"
				}
			},
			{
				name: "api-dynamic",
				urls: ["/api/**"],
				cacheConfig: {
					strategy: "freshness" as const,
					maxSize: 100,
					maxAge: "5m",
					timeout: "10s"
				}
			}
		]
	};

	beforeEach(async () =>
	{
		// Mock the global fetch function
		fetchSpy = spyOn(window, "fetch").and.returnValue(
			Promise.resolve(
				new Response(JSON.stringify(mockConfig), {
					status: 200,
					headers: { "Content-Type": "application/json" }
				})
			)
		);

		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});
		service = TestBed.inject(CacheConfigService);

		// Wait for config to load
		await service.waitForConfig();
	});

	afterEach(() =>
	{
		// Clean up the fetch spy
		if (fetchSpy)
		{
			fetchSpy.and.stub();
		}
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	it("should fetch config from /ngsw-config.json", () =>
	{
		expect(fetchSpy).toHaveBeenCalledWith("/ngsw-config.json");
	});

	describe("getTtl", () =>
	{
		it("should return 5 minutes for weather URLs", () =>
		{
			const ttl = service.getTtl("/weatherforecast");
			expect(ttl).toBe(5 * 60 * 1000); // 5 minutes
		});

		it("should return 5 minutes for /api/weather/** URLs", () =>
		{
			const ttl = service.getTtl("/api/weather/forecast");
			expect(ttl).toBe(5 * 60 * 1000); // 5 minutes
		});

		it("should return 1 hour for reference data URLs", () =>
		{
			const ttl1 = service.getTtl("/api/reference/cities");
			const ttl2 = service.getTtl("/api/config/settings");
			const ttl3 = service.getTtl("/api/lookup/states");

			expect(ttl1).toBe(60 * 60 * 1000); // 1 hour
			expect(ttl2).toBe(60 * 60 * 1000); // 1 hour
			expect(ttl3).toBe(60 * 60 * 1000); // 1 hour
		});

		it("should return 5 minutes for generic /api/** URLs", () =>
		{
			const ttl = service.getTtl("/api/users/123");
			expect(ttl).toBe(5 * 60 * 1000); // 5 minutes
		});

		it("should return default TTL for unmatched URLs", () =>
		{
			const ttl = service.getTtl("/some/random/url");
			expect(ttl).toBe(service.getDefaultTtl());
		});
	});

	describe("getStrategy", () =>
	{
		it("should return freshness for weather URLs", () =>
		{
			const strategy = service.getStrategy("/weatherforecast");
			expect(strategy).toBe("freshness");
		});

		it("should return performance for reference data", () =>
		{
			const strategy = service.getStrategy("/api/reference/data");
			expect(strategy).toBe("performance");
		});

		it("should return freshness as default", () =>
		{
			const strategy = service.getStrategy("/unknown");
			expect(strategy).toBe("freshness");
		});
	});

	describe("getTimeout", () =>
	{
		it("should return 5 seconds for weather URLs", () =>
		{
			const timeout = service.getTimeout("/weatherforecast");
			expect(timeout).toBe(5 * 1000); // 5 seconds
		});

		it("should return 10 seconds for generic API URLs", () =>
		{
			const timeout = service.getTimeout("/api/users");
			expect(timeout).toBe(10 * 1000); // 10 seconds
		});

		it("should return undefined for reference data (no timeout)", () =>
		{
			const timeout = service.getTimeout("/api/reference/data");
			expect(timeout).toBeUndefined();
		});
	});

	describe("getDataGroups", () =>
	{
		it("should return all configured data groups", () =>
		{
			const groups = service.getDataGroups();
			expect(groups.length).toBe(3);
			expect(groups[0].name).toBe("api-weather");
			expect(groups[1].name).toBe("api-reference-data");
			expect(groups[2].name).toBe("api-dynamic");
		});
	});

	describe("config loading", () =>
	{
		it("should indicate when config is loaded", () =>
		{
			expect(service.isConfigLoaded()).toBe(true);
		});
	});

	describe("error handling", () =>
	{
		it("should handle config load errors gracefully", async () =>
		{
			// Spy on console.error to suppress error output during test
			const consoleErrorSpy = spyOn(console, "error");

			// Reconfigure the existing spy to return an error for the next call
			fetchSpy.and.returnValue(
				Promise.reject(new Error("Network error"))
			);

			// Create a new service instance (will trigger a new fetch)
			const newService = new CacheConfigService();

			// Wait for config to load with error
			await newService.waitForConfig();

			expect(newService.isConfigLoaded()).toBe(true);
			const ttl = newService.getTtl("/api/test");
			expect(ttl).toBe(5 * 60 * 1000); // Default 5 minutes

			// Verify console.error was called with the expected message
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Failed to load ngsw-config.json, using defaults:",
				jasmine.any(Error)
			);
		});
	});
});
