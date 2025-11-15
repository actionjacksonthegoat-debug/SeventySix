import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { OneCallResponse } from "@home/weather/models";
import { OpenWeatherService } from "./open-weather.service";

describe("OpenWeatherService", () =>
{
	let service: OpenWeatherService;
	let httpMock: HttpTestingController;
	const apiBaseUrl = "https://localhost:7074/api/weatherforecast";

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [
				OpenWeatherService,
				provideHttpClient(),
				provideHttpClientTesting(),
				provideZonelessChangeDetection()
			]
		});

		service = TestBed.inject(OpenWeatherService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify();
	});

	describe("getCompleteWeather", () =>
	{
		it("should call OneCall API with correct coordinates", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const mockResponse: OneCallResponse = {
				lat: latitude,
				lon: longitude,
				timezone: "America/New_York",
				timezone_offset: -18000,
				current: {
					dt: 1699747200,
					sunrise: 1699707600,
					sunset: 1699743600,
					temp: 15.5,
					feels_like: 14.2,
					pressure: 1013,
					humidity: 65,
					dew_point: 9.0,
					clouds: 40,
					uvi: 2.5,
					visibility: 10000,
					wind_speed: 3.5,
					wind_deg: 180,
					weather: [
						{
							id: 801,
							main: "Clouds",
							description: "few clouds",
							icon: "02d"
						}
					]
				}
			};

			service.getCompleteWeather(latitude, longitude).subscribe({
				next: (response) =>
				{
					expect(response).toEqual(mockResponse);
					expect(response.lat).toBe(latitude);
					expect(response.lon).toBe(longitude);
					done();
				},
				error: done.fail
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}?latitude=${latitude}&longitude=${longitude}`
			);
			expect(req.request.method).toBe("GET");
			req.flush(mockResponse);
		});

		it("should include units parameter when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const units = "imperial";

			service
				.getCompleteWeather(latitude, longitude, { units })
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}?latitude=${latitude}&longitude=${longitude}&units=${units}`
			);
			expect(req.request.method).toBe("GET");
			req.flush({});
		});

		it("should include lang parameter when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const lang = "es";

			service
				.getCompleteWeather(latitude, longitude, { lang })
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}?latitude=${latitude}&longitude=${longitude}&lang=${lang}`
			);
			expect(req.request.method).toBe("GET");
			req.flush({});
		});

		it("should include both units and lang parameters when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const units = "metric";
			const lang = "fr";

			service
				.getCompleteWeather(latitude, longitude, { units, lang })
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}?latitude=${latitude}&longitude=${longitude}&units=${units}&lang=${lang}`
			);
			expect(req.request.method).toBe("GET");
			req.flush({});
		});

		it("should handle 429 rate limit error", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;

			service.getCompleteWeather(latitude, longitude).subscribe({
				next: () => done.fail("Should have failed with 429 error"),
				error: (error) =>
				{
					expect(error.status).toBe(429);
					done();
				}
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}?latitude=${latitude}&longitude=${longitude}`
			);
			req.flush("Rate limit exceeded", {
				status: 429,
				statusText: "Too Many Requests"
			});
		});

		it("should handle 503 service unavailable error", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;

			service.getCompleteWeather(latitude, longitude).subscribe({
				next: () => done.fail("Should have failed with 503 error"),
				error: (error) =>
				{
					expect(error.status).toBe(503);
					done();
				}
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}?latitude=${latitude}&longitude=${longitude}`
			);
			req.flush("Service unavailable", {
				status: 503,
				statusText: "Service Unavailable"
			});
		});

		it("should handle network error", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;

			service.getCompleteWeather(latitude, longitude).subscribe({
				next: () => done.fail("Should have failed with network error"),
				error: (error) =>
				{
					expect(error.status).toBe(0);
					done();
				}
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}?latitude=${latitude}&longitude=${longitude}`
			);
			req.error(new ProgressEvent("error"));
		});
	});

	describe("getCurrentWeather", () =>
	{
		it("should call current weather endpoint", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;

			service.getCurrentWeather(latitude, longitude).subscribe({
				next: () => done(),
				error: done.fail
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/current?latitude=${latitude}&longitude=${longitude}`
			);
			expect(req.request.method).toBe("GET");
			req.flush({});
		});

		it("should include options parameters when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const units = "imperial";
			const lang = "en";

			service
				.getCurrentWeather(latitude, longitude, { units, lang })
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/current?latitude=${latitude}&longitude=${longitude}&units=${units}&lang=${lang}`
			);
			expect(req.request.method).toBe("GET");
			req.flush({});
		});
	});

	describe("getHourlyForecast", () =>
	{
		it("should call hourly forecast endpoint", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;

			service.getHourlyForecast(latitude, longitude).subscribe({
				next: () => done(),
				error: done.fail
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/hourly?latitude=${latitude}&longitude=${longitude}`
			);
			expect(req.request.method).toBe("GET");
			req.flush([]);
		});

		it("should include options parameters when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const units = "metric";

			service
				.getHourlyForecast(latitude, longitude, { units })
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/hourly?latitude=${latitude}&longitude=${longitude}&units=${units}`
			);
			expect(req.request.method).toBe("GET");
			req.flush([]);
		});
	});

	describe("getDailyForecast", () =>
	{
		it("should call daily forecast endpoint", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;

			service.getDailyForecast(latitude, longitude).subscribe({
				next: () => done(),
				error: done.fail
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/daily?latitude=${latitude}&longitude=${longitude}`
			);
			expect(req.request.method).toBe("GET");
			req.flush([]);
		});

		it("should include options parameters when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const lang = "de";

			service.getDailyForecast(latitude, longitude, { lang }).subscribe({
				next: () => done(),
				error: done.fail
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/daily?latitude=${latitude}&longitude=${longitude}&lang=${lang}`
			);
			expect(req.request.method).toBe("GET");
			req.flush([]);
		});
	});

	describe("getMinutelyForecast", () =>
	{
		it("should call minutely forecast endpoint", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;

			service.getMinutelyForecast(latitude, longitude).subscribe({
				next: () => done(),
				error: done.fail
			});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/minutely?latitude=${latitude}&longitude=${longitude}`
			);
			expect(req.request.method).toBe("GET");
			req.flush([]);
		});

		it("should include options parameters when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const units = "imperial";
			const lang = "es";

			service
				.getMinutelyForecast(latitude, longitude, { units, lang })
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/minutely?latitude=${latitude}&longitude=${longitude}&units=${units}&lang=${lang}`
			);
			expect(req.request.method).toBe("GET");
			req.flush([]);
		});
	});

	describe("getHistoricalWeather", () =>
	{
		it("should call historical endpoint with timestamp", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const timestamp = 1699660800; // Yesterday

			service
				.getHistoricalWeather(latitude, longitude, timestamp)
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/historical?latitude=${latitude}&longitude=${longitude}&timestamp=${timestamp}`
			);
			expect(req.request.method).toBe("GET");
			req.flush({});
		});

		it("should include options parameters when provided", (done) =>
		{
			const latitude = 40.7128;
			const longitude = -74.006;
			const timestamp = 1699660800;
			const units = "imperial";
			const lang = "ja";

			service
				.getHistoricalWeather(latitude, longitude, timestamp, {
					units,
					lang
				})
				.subscribe({
					next: () => done(),
					error: done.fail
				});

			const req = httpMock.expectOne(
				`${apiBaseUrl}/historical?latitude=${latitude}&longitude=${longitude}&timestamp=${timestamp}&units=${units}&lang=${lang}`
			);
			expect(req.request.method).toBe("GET");
			req.flush({});
		});
	});

	describe("getQuotaStatus", () =>
	{
		it("should call quota endpoint", (done) =>
		{
			const mockQuota = {
				dailyLimit: 1000,
				remainingCalls: 856,
				resetTime: new Date("2025-11-12T00:00:00Z").toISOString()
			};

			service.getQuotaStatus().subscribe({
				next: (quota) =>
				{
					expect(quota).toEqual(mockQuota);
					done();
				},
				error: done.fail
			});

			const req = httpMock.expectOne(`${apiBaseUrl}/quota`);
			expect(req.request.method).toBe("GET");
			req.flush(mockQuota);
		});
	});
});
