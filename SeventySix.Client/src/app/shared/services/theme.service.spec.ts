import { setupSimpleServiceTest } from "@shared/testing";
import { vi } from "vitest";
import { ThemeService } from "./theme.service";

describe("ThemeService",
	() =>
	{
		let service: ThemeService;

		beforeEach(
			() =>
			{
			// Mock localStorage
				vi.spyOn(localStorage, "getItem")
					.mockReturnValue(null);
				vi.spyOn(localStorage, "setItem");

				service =
					setupSimpleServiceTest(ThemeService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should initialize with light theme",
			() =>
			{
				expect(service.brightness())
					.toBe("light");
			});

		it("should initialize with blue scheme",
			() =>
			{
				expect(service.colorScheme())
					.toBe("blue");
			});

		describe("toggleBrightness",
			() =>
			{
				it("should toggle from light to dark",
					() =>
					{
						service.setBrightness("light");
						service.toggleBrightness();
						expect(service.brightness())
							.toBe("dark");
					});

				it("should toggle from dark to light",
					() =>
					{
						service.setBrightness("dark");
						service.toggleBrightness();
						expect(service.brightness())
							.toBe("light");
					});
			});

		describe("toggleColorScheme",
			() =>
			{
				it("should toggle from blue to cyan-orange",
					() =>
					{
						service.setColorScheme("blue");
						service.toggleColorScheme();
						expect(service.colorScheme())
							.toBe("cyan-orange");
					});

				it("should toggle from cyan-orange to blue",
					() =>
					{
						service.setColorScheme("cyan-orange");
						service.toggleColorScheme();
						expect(service.colorScheme())
							.toBe("blue");
					});
			});

		describe("setBrightness",
			() =>
			{
				it("should set brightness",
					() =>
					{
						service.setBrightness("dark");
						expect(service.brightness())
							.toBe("dark");
					});
			});

		describe("setColorScheme",
			() =>
			{
				it("should set color scheme",
					() =>
					{
						service.setColorScheme("cyan-orange");
						expect(service.colorScheme())
							.toBe("cyan-orange");
					});
			});

		describe("computed themeName",
			() =>
			{
				it("should compute theme name",
					() =>
					{
						service.setBrightness("light");
						service.setColorScheme("blue");
						expect(service.themeName())
							.toBe("light-blue");

						service.setBrightness("dark");
						service.setColorScheme("cyan-orange");
						expect(service.themeName())
							.toBe("dark-cyan-orange");
					});
			});

		describe("helper methods",
			() =>
			{
				it("isDark should return correct value",
					() =>
					{
						service.setBrightness("dark");
						expect(service.isDark())
							.toBe(true);

						service.setBrightness("light");
						expect(service.isDark())
							.toBe(false);
					});

				it("isLight should return correct value",
					() =>
					{
						service.setBrightness("light");
						expect(service.isLight())
							.toBe(true);

						service.setBrightness("dark");
						expect(service.isLight())
							.toBe(false);
					});

				it("isBlue should return correct value",
					() =>
					{
						service.setColorScheme("blue");
						expect(service.isBlue())
							.toBe(true);

						service.setColorScheme("cyan-orange");
						expect(service.isBlue())
							.toBe(false);
					});

				it("isCyanOrange should return correct value",
					() =>
					{
						service.setColorScheme("cyan-orange");
						expect(service.isCyanOrange())
							.toBe(true);

						service.setColorScheme("blue");
						expect(service.isCyanOrange())
							.toBe(false);
					});
			});
	});
