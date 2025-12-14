import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WindowUtilities } from "@shared/utilities";
import { ServerErrorPage } from "./server-error";

describe("ServerErrorPage",
	() =>
	{
		let component: ServerErrorPage;
		let fixture: ComponentFixture<ServerErrorPage>;
		let mockWindowUtilities: jasmine.SpyObj<WindowUtilities>;

		beforeEach(
			async () =>
			{
				mockWindowUtilities =
					jasmine.createSpyObj("WindowUtilities",
						[
							"reload"
						]);

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
