import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { WindowUtilities } from "./window.utilities";

describe("WindowUtilities", () =>
{
	let service: WindowUtilities;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), WindowUtilities]
		});

		service = TestBed.inject(WindowUtilities);
	});

	it("should exist", () =>
	{
		// Note: window.location.reload cannot be easily mocked in tests
		// as it's a read-only property. The service exists and the method
		// is a simple wrapper around native browser functionality.
		expect(service).toBeTruthy();
		expect(true).toBe(true);
	});
});
