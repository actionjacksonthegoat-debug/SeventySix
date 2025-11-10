import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { HomePage } from "./home-page";
import { ThemeService } from "@core/services";

describe("HomePage", () =>
{
	let component: HomePage;
	let fixture: ComponentFixture<HomePage>;
	let mockThemeService: jasmine.SpyObj<ThemeService>;

	beforeEach(async () =>
	{
		mockThemeService = jasmine.createSpyObj("ThemeService", [
			"toggleBrightness"
		]);

		await TestBed.configureTestingModule({
			imports: [HomePage],
			providers: [
				provideZonelessChangeDetection(),
				provideRouter([]),
				{ provide: ThemeService, useValue: mockThemeService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(HomePage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should have stats", () =>
	{
		expect(component["stats"]).toBeDefined();
		expect(component["stats"].length).toBeGreaterThan(0);
	});

	it("should have quick actions", () =>
	{
		expect(component["quickActions"]).toBeDefined();
		expect(component["quickActions"].length).toBeGreaterThan(0);
	});

	it("should have recent activity signal", () =>
	{
		expect(component["recentActivity"]).toBeDefined();
		const activity = component["recentActivity"]();
		expect(Array.isArray(activity)).toBe(true);
	});
});
