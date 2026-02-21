import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SandboxLandingComponent } from "./sandbox-landing";

describe("SandboxLandingComponent",
	() =>
	{
		let component: SandboxLandingComponent;
		let fixture: ComponentFixture<SandboxLandingComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [SandboxLandingComponent],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(SandboxLandingComponent);
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

		it("should display sandbox heading",
			() =>
			{
				const heading: HTMLElement | null =
					fixture.nativeElement.querySelector("h1");
				expect(heading?.textContent)
					.toContain("Hello World");
			});
	});