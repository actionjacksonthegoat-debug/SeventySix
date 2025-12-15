import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FooterComponent } from "./footer.component";

describe("FooterComponent",
	() =>
	{
		let component: FooterComponent;
		let fixture: ComponentFixture<FooterComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
				.configureTestingModule(
					{
						imports: [FooterComponent],
						providers: [provideZonelessChangeDetection()]
					})
				.compileComponents();

				fixture =
					TestBed.createComponent(FooterComponent);
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

		it("should have current year",
			() =>
			{
				const currentYear: number =
					new Date()
					.getFullYear();
				expect(component["currentYear"])
				.toBe(currentYear);
			});

		it("should have version",
			() =>
			{
				expect(component["version"])
				.toBeDefined();
				expect(typeof component["version"])
				.toBe("string");
			});
	});
