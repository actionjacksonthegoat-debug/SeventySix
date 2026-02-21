import {
	HttpClient,
	provideHttpClient,
	withInterceptors
} from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { dateParserInterceptor } from "./date-parser.interceptor";

describe("dateParserInterceptor",
	() =>
	{
		let httpClient: HttpClient;
		let httpTestingController: HttpTestingController;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptors(
								[dateParserInterceptor])),
							provideHttpClientTesting()
						]
					});

				httpClient =
					TestBed.inject(HttpClient);
				httpTestingController =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpTestingController.verify();
			});

		it("should parse ISO date strings to Date objects",
			async () =>
			{
				const isoString: string = "2024-04-29T15:45:12.123Z";

				const responsePromise: Promise<{ timestamp: Date; }> =
					firstValueFrom(
						httpClient
							.get<{ timestamp: Date; }>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(
					{ timestamp: isoString });

				const response: { timestamp: Date; } =
					await responsePromise;
				expect(response.timestamp)
					.toBeInstanceOf(Date);
				expect(response.timestamp.toISOString())
					.toBe(isoString);
			});

		it("should parse nested ISO date strings",
			async () =>
			{
				const isoString: string = "2024-04-29T15:45:12.123Z";

				const responsePromise: Promise<{ data: { createdAt: Date; }; }> =
					firstValueFrom(
						httpClient
							.get<{ data: { createdAt: Date; }; }>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(
					{ data: { createdAt: isoString } });

				const response: { data: { createdAt: Date; }; } =
					await responsePromise;
				expect(response.data.createdAt)
					.toBeInstanceOf(Date);
				expect(response.data.createdAt.toISOString())
					.toBe(isoString);
			});

		it("should parse dates in arrays",
			async () =>
			{
				const isoString1: string = "2024-04-29T15:45:12.123Z";
				const isoString2: string = "2024-04-30T10:30:00.000Z";

				const responsePromise: Promise<{ timestamp: Date; }[]> =
					firstValueFrom(
						httpClient
							.get<{ timestamp: Date; }[]>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(
					[{ timestamp: isoString1 }, { timestamp: isoString2 }]);

				const response: { timestamp: Date; }[] =
					await responsePromise;
				expect(response[0].timestamp)
					.toBeInstanceOf(Date);
				expect(response[0].timestamp.toISOString())
					.toBe(isoString1);
				expect(response[1].timestamp)
					.toBeInstanceOf(Date);
				expect(response[1].timestamp.toISOString())
					.toBe(isoString2);
			});

		it("should not modify non-date strings",
			async () =>
			{
				const testData: { name: string; email: string; id: string; } =
					{
						name: "John Doe",
						email: "john@example.com",
						id: "12345"
					};

				const responsePromise: Promise<typeof testData> =
					firstValueFrom(
						httpClient
							.get<typeof testData>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(testData);

				const response: typeof testData =
					await responsePromise;
				expect(response.name)
					.toBe("John Doe");
				expect(response.email)
					.toBe("john@example.com");
				expect(response.id)
					.toBe("12345");
			});

		it("should handle null and undefined values",
			async () =>
			{
				const testData: { timestamp: Date | null; createdAt: Date | undefined; name: string; } =
					{
						timestamp: null,
						createdAt: undefined,
						name: "Test"
					};

				const responsePromise: Promise<typeof testData> =
					firstValueFrom(
						httpClient
							.get<typeof testData>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(testData);

				const response: typeof testData =
					await responsePromise;
				expect(response.timestamp)
					.toBeNull();
				expect(response.createdAt)
					.toBeUndefined();
				expect(response.name)
					.toBe("Test");
			});

		it("should handle empty response body",
			async () =>
			{
				const responsePromise: Promise<unknown> =
					firstValueFrom(
						httpClient
							.get("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(null);

				const response: unknown =
					await responsePromise;
				expect(response)
					.toBeNull();
			});

		it("should parse ISO dates without milliseconds",
			async () =>
			{
				const isoString: string = "2024-04-29T15:45:12Z";

				const responsePromise: Promise<{ timestamp: Date; }> =
					firstValueFrom(
						httpClient
							.get<{ timestamp: Date; }>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(
					{ timestamp: isoString });

				const response: { timestamp: Date; } =
					await responsePromise;
				expect(response.timestamp)
					.toBeInstanceOf(Date);
				expect(response.timestamp.toISOString())
					.toBe(
						"2024-04-29T15:45:12.000Z");
			});

		it("should handle complex nested structures",
			async () =>
			{
				const isoString: string = "2024-04-29T15:45:12.123Z";
				const complexData: {
					user: { profile: { createdAt: string; settings: { lastLogin: string; }; }; };
					logs: Array<{ timestamp: string; message: string; }>;
				} =
					{
						user: {
							profile: {
								createdAt: isoString,
								settings: {
									lastLogin: isoString
								}
							}
						},
						logs: [
							{ timestamp: isoString, message: "Log 1" },
							{ timestamp: isoString, message: "Log 2" }
						]
					};

				const responsePromise: Promise<typeof complexData> =
					firstValueFrom(
						httpClient
							.get<typeof complexData>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(complexData);

				const response: typeof complexData =
					await responsePromise;
				expect(response.user.profile.createdAt)
					.toBeInstanceOf(Date);
				expect(response.user.profile.settings.lastLogin)
					.toBeInstanceOf(
						Date);
				expect(response.logs[0].timestamp)
					.toBeInstanceOf(Date);
				expect(response.logs[1].timestamp)
					.toBeInstanceOf(Date);
			});

		it("should preserve non-ISO date-like strings",
			async () =>
			{
				const testData: { invalidDate: string; partialDate: string; description: string; } =
					{
						invalidDate: "2024-13-45",
						partialDate: "2024-04",
						description: "Meeting at 2024-04-29"
					};

				const responsePromise: Promise<typeof testData> =
					firstValueFrom(
						httpClient
							.get<typeof testData>("/api/test"));

				const req: TestRequest =
					httpTestingController.expectOne("/api/test");
				req.flush(testData);

				const response: typeof testData =
					await responsePromise;
				expect(typeof response.invalidDate)
					.toBe("string");
				expect(typeof response.partialDate)
					.toBe("string");
				expect(typeof response.description)
					.toBe("string");
			});
	});