import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import {
	QueryClient,
	provideAngularQuery
} from "@tanstack/angular-query-experimental";
import { PermissionRequestsComponent } from "./permission-requests.component";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequestRepository } from "@admin/permission-requests/repositories";

describe("PermissionRequestsComponent", (): void =>
{
	let fixture: ComponentFixture<PermissionRequestsComponent>;
	let component: PermissionRequestsComponent;

	beforeEach(async (): Promise<void> =>
	{
		await TestBed.configureTestingModule({
			imports: [PermissionRequestsComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideAngularQuery(new QueryClient()),
				PermissionRequestService,
				PermissionRequestRepository
			]
		}).compileComponents();

		fixture = TestBed.createComponent(PermissionRequestsComponent);
		component = fixture.componentInstance;
	});

	it("should create", (): void =>
	{
		expect(component).toBeTruthy();
	});

	it("should have loading state initially", async (): Promise<void> =>
	{
		await fixture.whenStable();
		expect(component.isLoading()).toBe(true);
	});

	it("should have empty requests array initially", (): void =>
	{
		expect(component.requests()).toEqual([]);
	});

	it("should define displayed columns", (): void =>
	{
		expect(component.displayedColumns).toEqual([
			"username",
			"requestedRole",
			"requestMessage",
			"createdBy",
			"createDate"
		]);
	});
});
