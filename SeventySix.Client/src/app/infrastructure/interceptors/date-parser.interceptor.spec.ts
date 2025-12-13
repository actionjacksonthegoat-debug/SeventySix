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
import { dateParserInterceptor } from "./date-parser.interceptor";

describe("dateParserInterceptor", () =>
{
	let httpClient: HttpClient;
	let httpTestingController: HttpTestingController;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(withInterceptors([dateParserInterceptor])),
				provideHttpClientTesting()
			]
		});

		httpClient =
			TestBed.inject(HttpClient);
		httpTestingController =
			TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpTestingController.verify();
	});

	it("should parse ISO date strings to Date objects", (done: DoneFn) =>
	{
		const isoString: string = "2024-04-29T15:45:12.123Z";

		httpClient
			.get<{ timestamp: Date; }>("/api/test")
			.subscribe((response) =>
			{
				expect(response.timestamp)
					.toBeInstanceOf(Date);
				expect(response.timestamp.toISOString())
					.toBe(isoString);
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush({ timestamp: isoString });
	});

	it("should parse nested ISO date strings", (done: DoneFn) =>
	{
		const isoString: string = "2024-04-29T15:45:12.123Z";

		httpClient
			.get<{ data: { createdAt: Date; }; }>("/api/test")
			.subscribe((response) =>
			{
				expect(response.data.createdAt)
					.toBeInstanceOf(Date);
				expect(response.data.createdAt.toISOString())
					.toBe(isoString);
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush({ data: { createdAt: isoString } });
	});

	it("should parse dates in arrays", (done: DoneFn) =>
	{
		const isoString1: string = "2024-04-29T15:45:12.123Z";
		const isoString2: string = "2024-04-30T10:30:00.000Z";

		httpClient
			.get<{ timestamp: Date; }[]>("/api/test")
			.subscribe((response) =>
			{
				expect(response[0].timestamp)
					.toBeInstanceOf(Date);
				expect(response[0].timestamp.toISOString())
					.toBe(isoString1);
				expect(response[1].timestamp)
					.toBeInstanceOf(Date);
				expect(response[1].timestamp.toISOString())
					.toBe(isoString2);
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush([{ timestamp: isoString1 }, { timestamp: isoString2 }]);
	});

	it("should not modify non-date strings", (done: DoneFn) =>
	{
		const testData: { name: string; email: string; id: string; } =
			{
				name: "John Doe",
				email: "john@example.com",
				id: "12345"
			};

		httpClient
			.get<typeof testData>("/api/test")
			.subscribe((response) =>
			{
				expect(response.name)
					.toBe("John Doe");
				expect(response.email)
					.toBe("john@example.com");
				expect(response.id)
					.toBe("12345");
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush(testData);
	});

	it("should handle null and undefined values", (done: DoneFn) =>
	{
		const testData: { timestamp: Date | null; createdAt: Date | undefined; name: string; } =
			{
				timestamp: null,
				createdAt: undefined,
				name: "Test"
			};

		httpClient
			.get<typeof testData>("/api/test")
			.subscribe((response) =>
			{
				expect(response.timestamp)
					.toBeNull();
				expect(response.createdAt)
					.toBeUndefined();
				expect(response.name)
					.toBe("Test");
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush(testData);
	});

	it("should handle empty response body", (done: DoneFn) =>
	{
		httpClient
			.get("/api/test")
			.subscribe((response) =>
			{
				expect(response)
					.toBeNull();
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush(null);
	});

	it("should parse ISO dates without milliseconds", (done: DoneFn) =>
	{
		const isoString: string = "2024-04-29T15:45:12Z";

		httpClient
			.get<{ timestamp: Date; }>("/api/test")
			.subscribe((response) =>
			{
				expect(response.timestamp)
					.toBeInstanceOf(Date);
				expect(response.timestamp.toISOString())
					.toBe(
						"2024-04-29T15:45:12.000Z");
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush({ timestamp: isoString });
	});

	it("should handle complex nested structures", (done: DoneFn) =>
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

		httpClient
			.get<typeof complexData>("/api/test")
			.subscribe((response) =>
			{
				expect(response.user.profile.createdAt)
					.toBeInstanceOf(Date);
				expect(response.user.profile.settings.lastLogin)
					.toBeInstanceOf(
						Date);
				expect(response.logs[0].timestamp)
					.toBeInstanceOf(Date);
				expect(response.logs[1].timestamp)
					.toBeInstanceOf(Date);
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush(complexData);
	});

	it("should preserve non-ISO date-like strings", (done: DoneFn) =>
	{
		const testData: { invalidDate: string; partialDate: string; description: string; } =
			{
				invalidDate: "2024-13-45",
				partialDate: "2024-04",
				description: "Meeting at 2024-04-29"
			};

		httpClient
			.get<typeof testData>("/api/test")
			.subscribe((response) =>
			{
				expect(typeof response.invalidDate)
					.toBe("string");
				expect(typeof response.partialDate)
					.toBe("string");
				expect(typeof response.description)
					.toBe("string");
				done();
			});

		const req: TestRequest =
			httpTestingController.expectOne("/api/test");
		req.flush(testData);
	});
});
