import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { PermissionRequestListPage } from "./permission-request-list";
import { PermissionRequestService } from "@admin/permission-requests/services";

describe("PermissionRequestListPage", () =>
{
	let fixture: ComponentFixture<PermissionRequestListPage>;

	const mockService: Partial<PermissionRequestService> =
	{
		getAllRequests: jasmine.createSpy("getAllRequests").and.returnValue({
			data: () => [],
			isLoading: () => false,
			error: () => null,
			isSuccess: () => true
		})
	};

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [PermissionRequestListPage],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClientTesting(),
				{ provide: PermissionRequestService, useValue: mockService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(PermissionRequestListPage);
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should render page header", () =>
	{
		const header: HTMLElement | null =
			fixture.nativeElement.querySelector("app-page-header");
		expect(header).toBeTruthy();
	});
});
