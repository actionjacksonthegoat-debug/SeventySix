import { Component } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Mock, vi } from "vitest";
import { SiteLayoutChangedDirective } from "./site-layout-changed.directive";

@Component(
	{
		template: `<div
		appSiteLayoutChanged
		(layoutChanged)="onLayoutChanged()"
	></div>`,
		imports: [SiteLayoutChangedDirective]
	})
class TestLayoutChangedComponent
{
	layoutChanged: Mock<() => void> =
		vi.fn();

	onLayoutChanged(): void
	{
		this.layoutChanged();
	}
}

describe("SiteLayoutChangedDirective",
	() =>
	{
		let component: TestLayoutChangedComponent;
		let fixture: ComponentFixture<TestLayoutChangedComponent>;

		beforeEach(
			async () =>
			{
				vi.useFakeTimers();

				await TestBed
					.configureTestingModule(
						{
							imports: [TestLayoutChangedComponent],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(TestLayoutChangedComponent);
				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		afterEach(
			() =>
			{
				vi.useRealTimers();
			});

		it("should create directive",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should emit layoutChanged on window resize",
			async () =>
			{
				window.dispatchEvent(new Event("resize"));

				// Advance past directive's 500ms debounce + buffer
				await vi.advanceTimersByTimeAsync(600);

				expect(component.layoutChanged)
					.toHaveBeenCalled();
			});
	});
