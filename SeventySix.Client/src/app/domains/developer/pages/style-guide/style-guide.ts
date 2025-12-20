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
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ConfirmDialogComponent } from "@shared/components";
import { SNACKBAR_DURATION } from "@shared/constants";
import { ThemeService } from "@shared/services";

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
			MatProgressBarModule
		],
		templateUrl: "./style-guide.html",
		styleUrl: "./style-guide.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class StyleGuideComponent
{
	protected readonly themeService: ThemeService =
		inject(ThemeService);
	private readonly snackBar: MatSnackBar =
		inject(MatSnackBar);
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

	showSnackbar(message: string): void
	{
		this.snackBar.open(message, "DISMISS",
			{
				duration: SNACKBAR_DURATION.success,
				horizontalPosition: "end",
				verticalPosition: "bottom"
			});
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
