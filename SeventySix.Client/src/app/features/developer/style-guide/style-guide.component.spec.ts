import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { StyleGuideComponent } from "./style-guide.component";
import { ThemeService } from "@core/services";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { createMockThemeService } from "@testing/mocks/theme.service.mock";
import { createMockSnackBar, createMockDialog } from "@testing";

describe("StyleGuideComponent", () =>
{
	let component: StyleGuideComponent;
	let fixture: ComponentFixture<StyleGuideComponent>;
	let mockThemeService: ReturnType<typeof createMockThemeService>;
	let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
	let mockDialog: jasmine.SpyObj<MatDialog>;

	beforeEach(async () =>
	{
		mockThemeService = createMockThemeService();
		mockSnackBar = createMockSnackBar();
		mockDialog = createMockDialog();

		await TestBed.configureTestingModule({
			imports: [StyleGuideComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: ThemeService, useValue: mockThemeService },
				{ provide: MatSnackBar, useValue: mockSnackBar },
				{ provide: MatDialog, useValue: mockDialog }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(StyleGuideComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});
});
