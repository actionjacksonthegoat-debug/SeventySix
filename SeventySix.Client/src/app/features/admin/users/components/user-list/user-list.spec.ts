import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
	QueryClient,
	provideAngularQuery
} from "@tanstack/angular-query-experimental";
import { UserList } from "./user-list";

describe("UserList", () =>
{
	let component: UserList;
	let fixture: ComponentFixture<UserList>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [UserList, NoopAnimationsModule],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideAngularQuery(new QueryClient())
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
