import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { provideRouter } from "@angular/router";
import { Subject } from "rxjs";
import { BreadcrumbComponent } from "./breadcrumb.component";

describe("BreadcrumbComponent", () =>
{
	let component: BreadcrumbComponent;
	let fixture: ComponentFixture<BreadcrumbComponent>;
	let routerEventsSubject: Subject<any>;

	beforeEach(async () =>
	{
		routerEventsSubject = new Subject();

		await TestBed.configureTestingModule({
			imports: [BreadcrumbComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideRouter([
					{ path: "", component: BreadcrumbComponent },
					{ path: "test", component: BreadcrumbComponent }
				])
			]
		}).compileComponents();

		fixture = TestBed.createComponent(BreadcrumbComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should have breadcrumbs signal", () =>
	{
		expect(component.breadcrumbs).toBeDefined();
	});

	it("should compute breadcrumbs", () =>
	{
		const breadcrumbs = component.breadcrumbs();
		expect(Array.isArray(breadcrumbs)).toBe(true);
	});

	it("should include home in breadcrumbs", () =>
	{
		const breadcrumbs = component.breadcrumbs();
		expect(
			breadcrumbs.some((b: { label: string }) => b.label === "Home")
		).toBe(true);
	});
});
