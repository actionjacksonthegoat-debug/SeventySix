import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialog } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ConfirmDialogComponent } from "@shared/components";
import {
	SKELETON_AVATAR,
	SKELETON_BUTTON,
	SKELETON_CARD,
	SKELETON_CHECKBOX,
	SKELETON_INPUT,
	SKELETON_TABLE_CELL,
	SKELETON_TEXT_LONG,
	SKELETON_TEXT_MEDIUM,
	SKELETON_TEXT_SHORT,
	SKELETON_TEXTAREA,
	SKELETON_TITLE,
	SkeletonTheme
} from "@shared/constants";
import { NotificationService, ThemeService } from "@shared/services";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

/**
 * Style Guide Page
 * Showcases all Material Design 3 components and design tokens used in the app
 */
@Component(
	{
		selector: "app-style-guide",
		imports: [
			MatCardModule,
			MatButtonModule,
			MatIconModule,
			MatChipsModule,
			MatDividerModule,
			MatFormFieldModule,
			MatInputModule,
			MatSelectModule,
			MatCheckboxModule,
			MatRadioModule,
			MatSlideToggleModule,
			MatTabsModule,
			MatTableModule,
			MatTooltipModule,
			MatProgressSpinnerModule,
			MatProgressBarModule,
			NgxSkeletonLoaderModule
		],
		templateUrl: "./style-guide.html",
		styleUrl: "./style-guide.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class StyleGuideComponent
{
	protected readonly themeService: ThemeService =
		inject(ThemeService);
	private readonly notificationService: NotificationService =
		inject(NotificationService);
	private readonly dialog: MatDialog =
		inject(MatDialog);

	// Example table data
	readonly tableData: Array<{
		id: number;
		name: string;
		weight: number;
		symbol: string;
	}> =
		[
			{ id: 1, name: "Hydrogen", weight: 1.0079, symbol: "H" },
			{ id: 2, name: "Helium", weight: 4.0026, symbol: "He" },
			{ id: 3, name: "Lithium", weight: 6.941, symbol: "Li" },
			{ id: 4, name: "Beryllium", weight: 9.0122, symbol: "Be" },
			{ id: 5, name: "Boron", weight: 10.811, symbol: "B" }
		];

	readonly displayedColumns: string[] =
		["id", "name", "weight", "symbol"];

	// Skeleton theme constants for demo
	protected readonly skeletonInput: SkeletonTheme =
		SKELETON_INPUT;
	protected readonly skeletonCheckbox: SkeletonTheme =
		SKELETON_CHECKBOX;
	protected readonly skeletonButton: SkeletonTheme =
		SKELETON_BUTTON;
	protected readonly skeletonTextShort: SkeletonTheme =
		SKELETON_TEXT_SHORT;
	protected readonly skeletonTextMedium: SkeletonTheme =
		SKELETON_TEXT_MEDIUM;
	protected readonly skeletonTextLong: SkeletonTheme =
		SKELETON_TEXT_LONG;
	protected readonly skeletonAvatar: SkeletonTheme =
		SKELETON_AVATAR;
	protected readonly skeletonTableCell: SkeletonTheme =
		SKELETON_TABLE_CELL;
	protected readonly skeletonCard: SkeletonTheme =
		SKELETON_CARD;
	protected readonly skeletonTitle: SkeletonTheme =
		SKELETON_TITLE;
	protected readonly skeletonTextarea: SkeletonTheme =
		SKELETON_TEXTAREA;

	showSnackbar(message: string): void
	{
		this.notificationService.success(message);
	}

	showDialog(): void
	{
		this.dialog.open(ConfirmDialogComponent,
			{
				data: {
					title: "Example Dialog",
					message: "This is an example confirmation dialog using Material Design.",
					confirmText: "OK",
					cancelText: "Cancel",
					confirmColor: "primary",
					icon: "info"
				}
			});
	}
}
