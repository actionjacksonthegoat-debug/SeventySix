import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { ThemeService } from "@core/services";
import { ConfirmDialogComponent } from "@shared/components";

/**
 * Style Guide Page
 * Showcases all Material Design 3 components and design tokens used in the app
 */
@Component({
	selector: "app-style-guide",
	imports: [
		CommonModule,
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
	templateUrl: "./style-guide.component.html",
	styleUrl: "./style-guide.component.scss"
})
export class StyleGuideComponent
{
	protected readonly themeService = inject(ThemeService);
	private readonly snackBar = inject(MatSnackBar);
	private readonly dialog = inject(MatDialog);

	// Example table data
	readonly tableData = [
		{ id: 1, name: "Hydrogen", weight: 1.0079, symbol: "H" },
		{ id: 2, name: "Helium", weight: 4.0026, symbol: "He" },
		{ id: 3, name: "Lithium", weight: 6.941, symbol: "Li" },
		{ id: 4, name: "Beryllium", weight: 9.0122, symbol: "Be" },
		{ id: 5, name: "Boron", weight: 10.811, symbol: "B" }
	];

	readonly displayedColumns = ["id", "name", "weight", "symbol"];

	showSnackbar(message: string): void
	{
		this.snackBar.open(message, "DISMISS", {
			duration: 3000,
			horizontalPosition: "end",
			verticalPosition: "bottom"
		});
	}

	showDialog(): void
	{
		this.dialog.open(ConfirmDialogComponent, {
			data: {
				title: "Example Dialog",
				message:
					"This is an example confirmation dialog using Material Design.",
				confirmText: "OK",
				cancelText: "Cancel",
				confirmColor: "primary",
				icon: "info"
			}
		});
	}
}
