import { Component } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
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
	layoutChanged: jasmine.Spy =
		jasmine.createSpy("layoutChanged");

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

		it("should create directive",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should emit layoutChanged on window resize",
			(done) =>
			{
				window.dispatchEvent(new Event("resize"));

				setTimeout(
					() =>
					{
						expect(component.layoutChanged)
							.toHaveBeenCalled();
						done();
					},
					600);
			});
	});
