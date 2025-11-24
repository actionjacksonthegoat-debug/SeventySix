import { TestBed } from "@angular/core/testing";
import { WindowUtilities } from "./window.utilities";

describe("WindowUtilities", () =>
{
	let service: WindowUtilities;
	let reloadSpy: jasmine.Spy;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [WindowUtilities]
		});

		service = TestBed.inject(WindowUtilities);

		// Spy on window.location.reload to prevent actual page reload during tests
		reloadSpy = spyOn(window.location, "reload");
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("reload", () =>
	{
		it("should call window.location.reload", () =>
		{
			service.reload();

			expect(reloadSpy).toHaveBeenCalled();
		});

		it("should call window.location.reload exactly once", () =>
		{
			service.reload();

			expect(reloadSpy).toHaveBeenCalledTimes(1);
		});

		it("should not throw an error when called", () =>
		{
			expect(() => service.reload()).not.toThrow();
		});
	});

	describe("service configuration", () =>
	{
		it("should be provided in root", () =>
		{
			const providedIn: string = (
				WindowUtilities as unknown as { ɵprov: { providedIn: string } }
			).ɵprov.providedIn;

			expect(providedIn).toBe("root");
		});

		it("should be injectable", () =>
		{
			expect(service).toBeInstanceOf(WindowUtilities);
		});
	});
});
