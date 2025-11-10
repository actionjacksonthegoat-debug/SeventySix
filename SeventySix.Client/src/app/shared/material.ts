// =============================================================================
// ANGULAR MATERIAL IMPORTS
// =============================================================================
// Centralized Material module imports for tree-shaking optimization
// Import only the Material modules needed throughout the application
// =============================================================================

// Material Core
import { MatCommonModule } from "@angular/material/core";
import { MatRippleModule } from "@angular/material/core";

// Layout Components
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatDividerModule } from "@angular/material/divider";
import { MatListModule } from "@angular/material/list";

// Buttons & Indicators
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatBadgeModule } from "@angular/material/badge";
import { MatChipsModule } from "@angular/material/chips";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

// Form Controls
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";

// Navigation
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatStepperModule } from "@angular/material/stepper";

// Data Table
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";

// Popups & Modals
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";

// Cards & Expansion
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";

// CDK (Component Dev Kit) - Virtual Scrolling, Drag & Drop
import { ScrollingModule } from "@angular/cdk/scrolling";
import { DragDropModule } from "@angular/cdk/drag-drop";

// =============================================================================
// MATERIAL MODULES ARRAY
// =============================================================================

/**
 * Array of all Material modules used in the application.
 * Import this array in components that need Material components.
 *
 * @example
 * ```typescript
 * import { MATERIAL_MODULES } from '@shared/material';
 *
 * @Component({
 *   imports: [CommonModule, ...MATERIAL_MODULES],
 *   // ...
 * })
 * export class MyComponent {}
 * ```
 */
export const MATERIAL_MODULES = [
	// Core
	MatCommonModule,
	MatRippleModule,

	// Layout
	MatSidenavModule,
	MatToolbarModule,
	MatDividerModule,
	MatListModule,

	// Buttons & Indicators
	MatButtonModule,
	MatIconModule,
	MatBadgeModule,
	MatChipsModule,
	MatProgressBarModule,
	MatProgressSpinnerModule,

	// Form Controls
	MatFormFieldModule,
	MatInputModule,
	MatSelectModule,
	MatAutocompleteModule,
	MatCheckboxModule,
	MatRadioModule,
	MatSlideToggleModule,
	MatSliderModule,
	MatDatepickerModule,
	MatNativeDateModule,

	// Navigation
	MatMenuModule,
	MatTabsModule,
	MatStepperModule,

	// Data Table
	MatTableModule,
	MatSortModule,
	MatPaginatorModule,

	// Popups & Modals
	MatDialogModule,
	MatSnackBarModule,
	MatTooltipModule,

	// Cards & Expansion
	MatCardModule,
	MatExpansionModule,

	// CDK
	ScrollingModule,
	DragDropModule
] as const;
