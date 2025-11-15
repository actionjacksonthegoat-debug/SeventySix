import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { of, throwError } from "rxjs";
import { ThirdPartyApiService } from "@admin/admin-dashboard/services";
import { ThirdPartyApiRequest } from "@admin/admin-dashboard/models";
import { ApiStatisticsTableComponent } from "./api-statistics-table.component";

describe("ApiStatisticsTableComponent", () =>
{
	let component: ApiStatisticsTableComponent;
	let fixture: ComponentFixture<ApiStatisticsTableComponent>;
	let thirdPartyApiService: jasmine.SpyObj<ThirdPartyApiService>;

	const mockApiData: ThirdPartyApiRequest[] = [
		{
			id: 1,
			apiName: "OpenWeather",
			baseUrl: "https://api.openweathermap.org",
			callCount: 1234,
			lastCalledAt: "2025-11-12T10:30:00Z",
			resetDate: "2025-11-12"
		},
		{
			id: 2,
			apiName: "GeocodeAPI",
			baseUrl: "https://api.geocode.com",
			callCount: 567,
			lastCalledAt: "2025-11-12T09:15:00Z",
			resetDate: "2025-11-12"
		}
	];

	beforeEach(async () =>
	{
		const thirdPartyApiServiceSpy = jasmine.createSpyObj(
			"ThirdPartyApiService",
			["getAll"]
		);

		await TestBed.configureTestingModule({
			imports: [ApiStatisticsTableComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: ThirdPartyApiService,
					useValue: thirdPartyApiServiceSpy
				}
			]
		}).compileComponents();

		thirdPartyApiService = TestBed.inject(
			ThirdPartyApiService
		) as jasmine.SpyObj<ThirdPartyApiService>;
		fixture = TestBed.createComponent(ApiStatisticsTableComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should load API data on init", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();

		expect(thirdPartyApiService.getAll).toHaveBeenCalled();
		expect(component.isLoading()).toBe(false);
		expect(component.dataSource().data.length).toBe(2);
	});

	it("should display API names", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();

		expect(component.dataSource().data[0].apiName).toBe("OpenWeather");
		expect(component.dataSource().data[1].apiName).toBe("GeocodeAPI");
	});

	it("should display call counts", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();

		expect(component.dataSource().data[0].callCount).toBe(1234);
		expect(component.dataSource().data[1].callCount).toBe(567);
	});

	it("should handle loading state", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		expect(component.isLoading()).toBe(true);

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
	});

	it("should handle errors gracefully", () =>
	{
		const errorMessage = "Failed to load API data";
		thirdPartyApiService.getAll.and.returnValue(
			throwError(() => new Error(errorMessage))
		);

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeTruthy();
		expect(component.dataSource().data.length).toBe(0);
	});

	it("should reload data when refresh is called", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();
		expect(thirdPartyApiService.getAll).toHaveBeenCalledTimes(1);

		component.onRefresh();

		expect(thirdPartyApiService.getAll).toHaveBeenCalledTimes(2);
	});

	it("should display table with correct columns", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();

		expect(component.displayedColumns()).toEqual([
			"apiName",
			"callCount",
			"lastCalledAt"
		]);
	});

	it("should handle empty data", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of([]));

		fixture.detectChanges();

		expect(component.dataSource().data.length).toBe(0);
	});

	it("should format last called date", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();

		const formatted = component.formatLastCalled(
			mockApiData[0].lastCalledAt!
		);
		expect(formatted).toBeTruthy();
		expect(formatted).not.toBe(mockApiData[0].lastCalledAt!);
	});

	it("should handle null last called date", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();

		const formatted = component.formatLastCalled(null);
		expect(formatted).toBe("Never");
	});

	it("should determine status based on last called time", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));

		fixture.detectChanges();

		const recentStatus = component.getStatus(new Date().toISOString());
		expect(recentStatus).toBe("ok");

		const oldStatus = component.getStatus("2020-01-01T00:00:00Z");
		expect(oldStatus).toBe("error");
	});

	it("should return error status for null timestamp", () =>
	{
		expect(component.getStatus(null)).toBe("error");
	});

	it("should return warning status for timestamps between 1-24 hours", () =>
	{
		const twoHoursAgo = new Date(
			Date.now() - 2 * 60 * 60 * 1000
		).toISOString();
		expect(component.getStatus(twoHoursAgo)).toBe("warning");
	});

	it('should format timestamp as "Just now" for very recent times', () =>
	{
		const justNow = new Date(Date.now() - 30000).toISOString(); // 30 seconds ago
		expect(component.formatLastCalled(justNow)).toBe("Just now");
	});

	it("should format timestamp as minutes ago", () =>
	{
		const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
		expect(component.formatLastCalled(fiveMinsAgo)).toBe("5 min ago");
	});

	it("should format timestamp as hours ago", () =>
	{
		const threeHoursAgo = new Date(
			Date.now() - 3 * 60 * 60 * 1000
		).toISOString();
		expect(component.formatLastCalled(threeHoursAgo)).toBe("3 hr ago");
	});

	it("should format timestamp as days ago", () =>
	{
		const threeDaysAgo = new Date(
			Date.now() - 3 * 24 * 60 * 60 * 1000
		).toISOString();
		expect(component.formatLastCalled(threeDaysAgo)).toBe("3 days ago");
	});

	it("should format old timestamps as date", () =>
	{
		const oldDate = "2025-10-01T00:00:00Z";
		const formatted = component.formatLastCalled(oldDate);
		expect(formatted).toMatch(/Oct|Sep/); // Depending on timezone
	});

	it("should handle errors without message gracefully", () =>
	{
		thirdPartyApiService.getAll.and.returnValue(throwError(() => ({})));

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBe("Failed to load API data");
		expect(component.dataSource().data.length).toBe(0);
	});
});
