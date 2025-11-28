import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
	QueryClient,
	provideTanStackQuery
} from "@tanstack/angular-query-experimental";
import { UserList } from "./user-list";
import {
	UserService,
	UserExportService,
	UserPreferencesService
} from "@admin/users/services";
import { UserRepository } from "@admin/users/repositories";

describe("UserList", () =>
{
	let component: UserList;
	let fixture: ComponentFixture<UserList>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [UserList],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTanStackQuery(new QueryClient()),
				// Feature-scoped services (no longer providedIn: root)
				UserService,
				UserRepository,
				UserExportService,
				UserPreferencesService
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should define column configuration", () =>
	{
		expect(component.columns).toBeDefined();
		expect(component.columns.length).toBe(7);
		expect(component.columns[0].key).toBe("id");
	});

	it("should define quick filters", () =>
	{
		expect(component.quickFilters).toBeDefined();
		expect(component.quickFilters.length).toBe(3);
		expect(component.quickFilters[0].key).toBe("all");
	});

	it("should define row actions", () =>
	{
		expect(component.rowActions).toBeDefined();
		expect(component.rowActions.length).toBe(4);
	});

	it("should define bulk actions", () =>
	{
		expect(component.bulkActions).toBeDefined();
		expect(component.bulkActions.length).toBe(3);
	});
});
