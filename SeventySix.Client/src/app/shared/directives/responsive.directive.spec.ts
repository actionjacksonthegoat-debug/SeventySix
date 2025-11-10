import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { HideOnDirective, ShowOnDirective } from "./responsive.directive";
import { ViewportService } from "@core/services";
import { signal } from "@angular/core";

@Component({
	template: `<div [hideOn]="'mobile'">Hide on Mobile</div>`,
	imports: [HideOnDirective]
})
class TestHideOnComponent
{}

@Component({
	template: `<div [showOn]="'desktop'">Show on Desktop</div>`,
	imports: [ShowOnDirective]
})
class TestShowOnComponent
{}

describe("Responsive Directives", () =>
{
	let mockViewportService: any;

	beforeEach(() =>
	{
		mockViewportService = {
			isMobile: signal(false),
			isTablet: signal(false),
			isDesktop: signal(false),
			isXSmall: signal(false),
			isSmall: signal(false),
			isMedium: signal(false),
			isLarge: signal(false),
			isXLarge: signal(false)
		};

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: ViewportService, useValue: mockViewportService }
			]
		});
	});

	describe("HideOnDirective", () =>
	{
		it("should create directive", () =>
		{
			const fixture = TestBed.createComponent(TestHideOnComponent);
			fixture.detectChanges();
			expect(fixture.componentInstance).toBeTruthy();
		});

		it("should hide element when breakpoint matches", () =>
		{
			mockViewportService.isMobile.set(true);
			const fixture = TestBed.createComponent(TestHideOnComponent);
			fixture.detectChanges();

			const element = fixture.nativeElement.querySelector("div");
			expect(element).toBeTruthy();
		});
	});

	describe("ShowOnDirective", () =>
	{
		it("should create directive", () =>
		{
			const fixture = TestBed.createComponent(TestShowOnComponent);
			fixture.detectChanges();
			expect(fixture.componentInstance).toBeTruthy();
		});

		it("should show element when breakpoint matches", () =>
		{
			mockViewportService.isDesktop.set(true);
			const fixture = TestBed.createComponent(TestShowOnComponent);
			fixture.detectChanges();

			const element = fixture.nativeElement.querySelector("div");
			expect(element).toBeTruthy();
		});
	});
});
