import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ThirdPartyApiService } from "@admin/admin-dashboard/services";
import { ThirdPartyApiRequest } from "@admin/admin-dashboard/models";
import { ApiStatisticsTableComponent } from "./api-statistics-table.component";
import { createMockQueryResult } from "@testing/tanstack-query-helpers";

describe("ApiStatisticsTableComponent", () =>
{
	let component: ApiStatisticsTableComponent;
	let fixture: ComponentFixture<ApiStatisticsTableComponent>;
	let thirdPartyApiService: jasmine.SpyObj<ThirdPartyApiService>;

	const mockApiData: ThirdPartyApiRequest[] = [
		{
			id: 1,
			apiName: "ExternalAPI",
			baseUrl: "https://api.example.com",
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
			["createAllQuery"]
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
	});

	function createComponent(): void
	{
		fixture = TestBed.createComponent(ApiStatisticsTableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it("should create", () =>
	{
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult(mockApiData)
		);

		createComponent();

		expect(component).toBeTruthy();
	});

	it("should load API data on init", () =>
	{
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult(mockApiData)
		);

		createComponent();

		expect(thirdPartyApiService.createAllQuery).toHaveBeenCalled();
		expect(component.isLoading()).toBe(false);
		expect(component.dataSource().data.length).toBe(2);
	});

	it("should display API names", () =>
	{
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult(mockApiData)
		);

		createComponent();

		expect(component.dataSource().data[0].apiName).toBe("ExternalAPI");
		expect(component.dataSource().data[1].apiName).toBe("GeocodeAPI");
	});

	it("should display call counts", () =>
	{
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult(mockApiData)
		);

		createComponent();

		expect(component.dataSource().data[0].callCount).toBe(1234);
		expect(component.dataSource().data[1].callCount).toBe(567);
	});

	it("should handle loading state", () =>
	{
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult<ThirdPartyApiRequest[]>(undefined, {
				isLoading: true
			})
		);

		createComponent();

		expect(component.isLoading()).toBe(true);
	});

	it("should display error message when API data query fails", () =>
	{
		const errorMessage = "Failed to load API data";
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult<ThirdPartyApiRequest[]>(undefined, {
				isError: true,
				error: new Error(errorMessage)
			})
		);

		createComponent();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeTruthy();
		expect(component.dataSource().data.length).toBe(0);
	});

	it("should reload data when refresh is called", () =>
	{
		const mockQuery = createMockQueryResult(mockApiData);
		thirdPartyApiService.createAllQuery.and.returnValue(mockQuery);

		createComponent();
		expect(thirdPartyApiService.createAllQuery).toHaveBeenCalledTimes(1);

		component.onRefresh();

		expect(mockQuery.refetch).toHaveBeenCalled();
	});

	it("should display table with correct columns", () =>
	{
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult(mockApiData)
		);

		createComponent();

		expect(component.displayedColumns()).toEqual([
			"apiName",
			"callCount",
			"lastCalledAt"
		]);
	});

	it("should handle empty data", () =>
	{
		thirdPartyApiService.createAllQuery.and.returnValue(
			createMockQueryResult<ThirdPartyApiRequest[]>([])
		);

		createComponent();

		expect(component.dataSource().data.length).toBe(0);
	});
});
