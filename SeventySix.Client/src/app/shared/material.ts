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
import { MatDividerModule } from "@angular/material/divider";
import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";

// Buttons & Indicators
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

// Form Controls
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";

// Navigation
import { MatMenuModule } from "@angular/material/menu";
import { MatStepperModule } from "@angular/material/stepper";
import { MatTabsModule } from "@angular/material/tabs";

// Data Table
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";

// Popups & Modals
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";

// Cards & Expansion
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";

// CDK (Component Dev Kit) - Virtual Scrolling, Drag & Drop
import { DragDropModule } from "@angular/cdk/drag-drop";
import { ScrollingModule } from "@angular/cdk/scrolling";

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
export const MATERIAL_MODULES: readonly (typeof MatCommonModule)[] =
	[
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
