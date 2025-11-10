import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { HeaderComponent } from "./header.component";
import { ThemeService } from "@core/services/theme.service";
import { LayoutService } from "@core/services/layout.service";
import { createMockThemeService } from "@testing/mocks/theme.service.mock";

describe("HeaderComponent", () =>
{
	let component: HeaderComponent;
	let fixture: ComponentFixture<HeaderComponent>;
	let mockThemeService: ReturnType<typeof createMockThemeService>;
	let mockLayoutService: jasmine.SpyObj<LayoutService>;

	beforeEach(async () =>
	{
		mockThemeService = createMockThemeService();
		mockLayoutService = jasmine.createSpyObj("LayoutService", [
			"toggleSidebar"
		]);

		await TestBed.configureTestingModule({
			imports: [HeaderComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideRouter([]),
				{ provide: ThemeService, useValue: mockThemeService },
				{ provide: LayoutService, useValue: mockLayoutService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(HeaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should toggle sidebar", () =>
	{
		component.toggleSidebar();
		expect(mockLayoutService.toggleSidebar).toHaveBeenCalled();
	});

	it("should toggle brightness", () =>
	{
		spyOn(mockThemeService, "toggleBrightness");
		component.toggleBrightness();
		expect(mockThemeService.toggleBrightness).toHaveBeenCalled();
	});

	it("should toggle color scheme", () =>
	{
		spyOn(mockThemeService, "toggleColorScheme");
		component.toggleColorScheme();
		expect(mockThemeService.toggleColorScheme).toHaveBeenCalled();
	});
});
