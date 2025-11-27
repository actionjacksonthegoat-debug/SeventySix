import { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { HeaderComponent } from "./header.component";
import { ThemeService } from "@infrastructure/services/theme.service";
import { LayoutService } from "@infrastructure/services/layout.service";
import { createMockThemeService } from "@testing/mocks/theme.service.mock";
import { ComponentTestBed } from "@testing";

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

		fixture = await new ComponentTestBed<HeaderComponent>()
			.withProvider(provideRouter([]))
			.withProvider({ provide: ThemeService, useValue: mockThemeService })
			.withProvider({
				provide: LayoutService,
				useValue: mockLayoutService
			})
			.build(HeaderComponent);

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
