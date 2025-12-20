import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { NotificationService, ThemeService } from "@shared/services";
import { createMockDialog, createMockNotificationService } from "@shared/testing";
import { createMockThemeService } from "@testing/mocks/theme.service.mock";
import { StyleGuideComponent } from "./style-guide";

describe("StyleGuideComponent",
	() =>
	{
		let component: StyleGuideComponent;
		let fixture: ComponentFixture<StyleGuideComponent>;
		let mockThemeService: ReturnType<typeof createMockThemeService>;
		let mockNotificationService: jasmine.SpyObj<NotificationService>;
		let mockDialog: jasmine.SpyObj<MatDialog>;

		beforeEach(
			async () =>
			{
				mockThemeService =
					createMockThemeService();
				mockNotificationService =
					createMockNotificationService();
				mockDialog =
					createMockDialog();

				await TestBed
					.configureTestingModule(
						{
							imports: [StyleGuideComponent],
							providers: [
								provideZonelessChangeDetection(),
								{ provide: ThemeService, useValue: mockThemeService },
								{ provide: NotificationService, useValue: mockNotificationService },
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
