import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PageHeaderComponent } from "./page-header";

describe("PageHeaderComponent",
	() =>
	{
		beforeEach(
			async () =>
			{
				await TestBed
				.configureTestingModule(
					{
						imports: [PageHeaderComponent],
						providers: [provideZonelessChangeDetection()]
					})
				.compileComponents();
			});

		it("should display title",
			async () =>
			{
				const fixture: ComponentFixture<PageHeaderComponent> =
					TestBed.createComponent(PageHeaderComponent);
				fixture.componentRef.setInput("title", "Test Title");
				await fixture.whenStable();
				fixture.detectChanges();

				expect(fixture.nativeElement.textContent)
				.toContain("Test Title");
			});

		it("should display icon when provided",
			async () =>
			{
				const fixture: ComponentFixture<PageHeaderComponent> =
					TestBed.createComponent(PageHeaderComponent);
				fixture.componentRef.setInput("title", "Test");
				fixture.componentRef.setInput("icon", "people");
				await fixture.whenStable();
				fixture.detectChanges();

				const icon: HTMLElement | null =
					fixture.nativeElement.querySelector("mat-icon");
				expect(icon)
				.toBeTruthy();
			});
	});
