import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { RVCamper } from "./rv-camper";

describe("RVCamper", () =>
{
	let component: RVCamper;
	let fixture: ComponentFixture<RVCamper>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [RVCamper],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(RVCamper);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		fixture.detectChanges();
		expect(component).toBeTruthy();
	});

	it("should have title property", () =>
	{
		expect(component.title).toBe("RV Camper Projects");
	});

	it("should have description property", () =>
	{
		expect(component.description).toContain("RV camper");
	});

	it("should render title in template", () =>
	{
		fixture.detectChanges();
		const compiled: HTMLElement = fixture.nativeElement;
		const titleElement: HTMLElement | null =
			compiled.querySelector("mat-card-title");
		expect(titleElement?.textContent?.trim()).toBe("RV Camper Projects");
	});

	it("should render description in template", () =>
	{
		fixture.detectChanges();
		const compiled: HTMLElement = fixture.nativeElement;
		const descriptionElement: HTMLElement | null =
			compiled.querySelector("p");
		expect(descriptionElement?.textContent?.trim()).toContain("RV camper");
	});

	it("should apply tertiary color theme class", () =>
	{
		fixture.detectChanges();
		const compiled: HTMLElement = fixture.nativeElement;
		const card: HTMLElement | null =
			compiled.querySelector(".rv-camper-card");
		expect(card).toBeTruthy();
	});
});
