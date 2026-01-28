import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WindowService } from "@shared/services";
import { vi } from "vitest";
import { ServerErrorPage } from "./server-error";

interface MockWindowService
{
	reload: ReturnType<typeof vi.fn>;
}

describe("ServerErrorPage",
	() =>
	{
		let component: ServerErrorPage;
		let fixture: ComponentFixture<ServerErrorPage>;
		let mockWindowService: MockWindowService;

		beforeEach(
			async () =>
			{
				mockWindowService =
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
								{ provide: WindowService, useValue: mockWindowService }
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
				expect(mockWindowService.reload)
					.toHaveBeenCalled();
			});
	});
