import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { HomePage } from "./home-page";

describe("HomePage", () =>
{
	let component: HomePage;
	let fixture: ComponentFixture<HomePage>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [HomePage],
			providers: [provideZonelessChangeDetection(), provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(HomePage);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		fixture.detectChanges();
		expect(component).toBeTruthy();
	});

	it("should have 3 quick actions", () =>
	{
		expect(component["quickActions"]).toBeDefined();
		expect(component["quickActions"].length).toBe(3);
	});

	it("should have WorldMap action with primary theme", () =>
	{
		const worldMapAction = component["quickActions"].find(
			(a) => a.route === "/game"
		);
		expect(worldMapAction).toBeDefined();
		expect(worldMapAction?.title).toBe("World Map");
		expect(worldMapAction?.themeClass).toBe("theme-primary");
	});

	it("should have Physics action with secondary theme", () =>
	{
		const physicsAction = component["quickActions"].find(
			(a) => a.route === "/physics"
		);
		expect(physicsAction).toBeDefined();
		expect(physicsAction?.title).toBe("Physics");
		expect(physicsAction?.themeClass).toBe("theme-secondary");
	});

	it("should have RVCamper action with tertiary theme", () =>
	{
		const rvAction = component["quickActions"].find(
			(a) => a.route === "/rv-camper"
		);
		expect(rvAction).toBeDefined();
		expect(rvAction?.title).toBe("RV Camper");
		expect(rvAction?.themeClass).toBe("theme-tertiary");
	});

	it("should render all 3 feature cards", () =>
	{
		fixture.detectChanges();
		const compiled: HTMLElement = fixture.nativeElement;
		const cards: NodeListOf<Element> =
			compiled.querySelectorAll(".feature-card");
		expect(cards.length).toBe(3);
	});

	it("should apply correct theme classes to cards", () =>
	{
		fixture.detectChanges();
		const compiled: HTMLElement = fixture.nativeElement;
		const primaryCard: Element | null =
			compiled.querySelector(".theme-primary");
		const secondaryCard: Element | null =
			compiled.querySelector(".theme-secondary");
		const tertiaryCard: Element | null =
			compiled.querySelector(".theme-tertiary");
		expect(primaryCard).toBeTruthy();
		expect(secondaryCard).toBeTruthy();
		expect(tertiaryCard).toBeTruthy();
	});
});
