import { Component } from "@angular/core";
import {
	ComponentFixture,
	TestBed
} from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { AccessibleIconButtonDirective } from "./accessible-icon-button.directive";

@Component(
	{
		template: `
		<button
			mat-icon-button
			appAccessibleIconButton="Close menu">
			<span>X</span>
		</button>
	`,
		imports: [AccessibleIconButtonDirective]
	})
class TestComponent
{}

describe("AccessibleIconButtonDirective",
	() =>
	{
		let fixture: ComponentFixture<TestComponent>;
		let buttonElement: HTMLElement;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						imports: [
							TestComponent,
							AccessibleIconButtonDirective
						],
						providers: [provideZonelessChangeDetection()]
					});

				fixture =
					TestBed.createComponent(TestComponent);
				fixture.detectChanges();
				buttonElement =
					fixture.nativeElement.querySelector("button");
			});

		it("should create directive instance",
			() =>
			{
				expect(buttonElement)
					.toBeTruthy();
			});

		it("should set aria-label attribute from input",
			() =>
			{
				expect(buttonElement.getAttribute("aria-label"))
					.toBe("Close menu");
			});

		it("should have mat-icon-button attribute",
			() =>
			{
				expect(buttonElement.hasAttribute("mat-icon-button"))
					.toBe(true);
			});
	});
