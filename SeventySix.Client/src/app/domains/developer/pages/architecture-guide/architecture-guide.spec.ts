import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ArchitectureGuideComponent } from "./architecture-guide";

describe("ArchitectureGuideComponent",
	() =>
	{
		let component: ArchitectureGuideComponent;
		let fixture: ComponentFixture<ArchitectureGuideComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [ArchitectureGuideComponent],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ArchitectureGuideComponent);
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

		it("should display architecture guide heading",
			() =>
			{
				const heading: HTMLElement | null =
					fixture.nativeElement.querySelector("h1");
				expect(heading?.textContent)
					.toContain("Architecture Guide");
			});
	});
