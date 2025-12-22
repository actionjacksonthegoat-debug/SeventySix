import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WindowUtilities } from "@shared/utilities";
import { vi } from "vitest";
import { ServerErrorPage } from "./server-error";

interface MockWindowUtilities
{
	reload: ReturnType<typeof vi.fn>;
}

describe("ServerErrorPage",
	() =>
	{
		let component: ServerErrorPage;
		let fixture: ComponentFixture<ServerErrorPage>;
		let mockWindowUtilities: MockWindowUtilities;

		beforeEach(
			async () =>
			{
				mockWindowUtilities =
					{
						reload: vi.fn()
					};
				await TestBed
					.configureTestingModule(
						{
							imports: [ServerErrorPage],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								{ provide: WindowUtilities, useValue: mockWindowUtilities }
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ServerErrorPage);
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

		it("should reload page",
			() =>
			{
				// Act
				component.reloadPage();

				// Assert
				expect(mockWindowUtilities.reload)
					.toHaveBeenCalled();
			});
	});
