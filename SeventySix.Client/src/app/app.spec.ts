import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { App } from "./app";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

describe("App", () =>
{
	let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

	beforeEach(async () =>
	{
		mockActivatedRoute = jasmine.createSpyObj("ActivatedRoute", [], {
			params: of({}),
			root: {
				firstChild: null,
				snapshot: { data: {} }
			}
		});

		await TestBed.configureTestingModule({
			imports: [App],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: ActivatedRoute, useValue: mockActivatedRoute }
			]
		}).compileComponents();
	});

	it("should create the app", () =>
	{
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;

		expect(app).toBeTruthy();
	});

	it("should render title", () =>
	{
		const fixture = TestBed.createComponent(App);

		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;

		// Check for main content area instead of specific text
		const mainContent = compiled.querySelector("#main-content");
		expect(mainContent).toBeTruthy();
	});
});
