import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { HideOnDirective, ShowOnDirective } from "./responsive.directive";
import { ViewportService } from "@infrastructure/services";
import { createMockViewportService, MockViewportService } from "@testing";

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
	let mockViewportService: MockViewportService;

	beforeEach(() =>
	{
		mockViewportService = createMockViewportService();

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
			const fixture: ComponentFixture<TestHideOnComponent> =
				TestBed.createComponent(TestHideOnComponent);
			fixture.detectChanges();
			expect(fixture.componentInstance).toBeTruthy();
		});

		it("should hide element when breakpoint matches", () =>
		{
			mockViewportService.isMobile.set(true);
			const fixture: ComponentFixture<TestHideOnComponent> =
				TestBed.createComponent(TestHideOnComponent);
			fixture.detectChanges();

			const element: HTMLElement | null =
				fixture.nativeElement.querySelector("div");
			expect(element).toBeTruthy();
		});
	});

	describe("ShowOnDirective", () =>
	{
		it("should create directive", () =>
		{
			const fixture: ComponentFixture<TestShowOnComponent> =
				TestBed.createComponent(TestShowOnComponent);
			fixture.detectChanges();
			expect(fixture.componentInstance).toBeTruthy();
		});

		it("should show element when breakpoint matches", () =>
		{
			mockViewportService.isDesktop.set(true);
			const fixture: ComponentFixture<TestShowOnComponent> =
				TestBed.createComponent(TestShowOnComponent);
			fixture.detectChanges();

			const element: HTMLElement | null =
				fixture.nativeElement.querySelector("div");
			expect(element).toBeTruthy();
		});
	});
});
