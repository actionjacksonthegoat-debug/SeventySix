import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { UnauthorizedPage } from "./unauthorized";

describe("UnauthorizedPage",
	() =>
	{
		let component: UnauthorizedPage;
		let fixture: ComponentFixture<UnauthorizedPage>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [UnauthorizedPage],
							providers: [provideZonelessChangeDetection(), provideRouter([])]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(UnauthorizedPage);
				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should display unauthorized heading",
			() =>
			{
				const heading: HTMLElement | null =
					fixture.nativeElement.querySelector("#error-title");
				expect(heading?.textContent)
					.toContain("401 - Unauthorized");
			});

		it("should have home link",
			() =>
			{
				const homeButton: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"button[routerLink='/']");
				expect(homeButton)
					.toBeTruthy();
			});
	});