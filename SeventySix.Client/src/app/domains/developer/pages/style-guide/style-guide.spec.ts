import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ThemeService } from "@shared/services";
import { createMockDialog, createMockSnackBar } from "@shared/testing";
import { createMockThemeService } from "@testing/mocks/theme.service.mock";
import { StyleGuideComponent } from "./style-guide";

describe("StyleGuideComponent",
	() =>
	{
		let component: StyleGuideComponent;
		let fixture: ComponentFixture<StyleGuideComponent>;
		let mockThemeService: ReturnType<typeof createMockThemeService>;
		let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
		let mockDialog: jasmine.SpyObj<MatDialog>;

		beforeEach(
			async () =>
			{
				mockThemeService =
					createMockThemeService();
				mockSnackBar =
					createMockSnackBar();
				mockDialog =
					createMockDialog();

				await TestBed
					.configureTestingModule(
						{
							imports: [StyleGuideComponent],
							providers: [
								provideZonelessChangeDetection(),
								{ provide: ThemeService, useValue: mockThemeService },
								{ provide: MatSnackBar, useValue: mockSnackBar },
								{ provide: MatDialog, useValue: mockDialog }
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(StyleGuideComponent);
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
	});
