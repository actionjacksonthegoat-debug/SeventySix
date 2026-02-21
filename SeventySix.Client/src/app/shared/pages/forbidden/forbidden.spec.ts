import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ForbiddenPage } from "./forbidden";

describe("ForbiddenPage",
	() =>
	{
		let component: ForbiddenPage;
		let fixture: ComponentFixture<ForbiddenPage>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [ForbiddenPage],
							providers: [provideZonelessChangeDetection(), provideRouter([])]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ForbiddenPage);
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

		it("should display forbidden heading",
			() =>
			{
				const heading: HTMLElement | null =
					fixture.nativeElement.querySelector("#error-title");
				expect(heading?.textContent)
					.toContain("403 - Forbidden");
			});

		it("should have home link",
			() =>
			{
				const homeButton: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"a[href='/'], button[routerLink='/']");
				expect(homeButton)
					.toBeTruthy();
			});
	});