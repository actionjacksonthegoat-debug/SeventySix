/**
 * Material Module Bundles
 * Reduces import boilerplate by grouping commonly used Material modules.
 *
 * USAGE:
 * import { FORM_MATERIAL_MODULES } from "@shared/material-bundles.constants";
 *
 * @Component({
 *     imports: [CommonModule, ...FORM_MATERIAL_MODULES]
 * })
 *
 * PATTERNS:
 * - FORM: Form fields, inputs, buttons for data entry
 * - TABLE: Data tables with pagination, sorting, filtering
 * - DIALOG: Modal dialogs and overlays
 * - NAVIGATION: Buttons, icons, menus for navigation
 */

import type { Type } from "@angular/core";

// Form Field Imports
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";

// Table Imports
import { MatChipsModule } from "@angular/material/chips";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";

// Dialog Imports
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";

// Layout Imports
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
// import { MatExpansionModule } from "@angular/material/expansion";
// import { MatListModule } from "@angular/material/list";
import { MatStepperModule } from "@angular/material/stepper";
// import { MatTabsModule } from "@angular/material/tabs";
// import { MatToolbarModule } from "@angular/material/toolbar";

// Progress Imports
// import { MatProgressBarModule } from "@angular/material/progress-bar";

/**
 * Common Material Modules
 * Base modules used across all UI patterns (DRY principle)
 * Not exported - used internally to compose other bundles
 */
const COMMON_MATERIAL_MODULES: readonly Type<unknown>[] =
	[
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule
	] as const;

/**
 * Form Material Modules Bundle
 * Common modules for form components with inputs and buttons.
 *
 * Includes:
 * - Form fields, inputs, select, checkbox, radio
 * - Buttons and icons
 * - Date pickers and toggles
 * - Card layouts
 * - Progress spinners
 *
 * Use for: User forms, login, registration, settings
 */
export const FORM_MATERIAL_MODULES: readonly Type<unknown>[] =
	[
		...COMMON_MATERIAL_MODULES,
		MatFormFieldModule,
		MatInputModule,
		MatCheckboxModule,
		MatRadioModule,
		MatSelectModule,
		MatDatepickerModule,
		MatSlideToggleModule,
		MatCardModule
	] as const;

/**
 * Table Material Modules Bundle
 * Comprehensive set for data table components.
 *
 * Includes:
 * - Table, pagination, sorting
 * - Progress spinners for loading
 * - Chips for tags/status
 * - Tooltips and menus
 *
 * Use for: User lists, log tables, data grids
 */
export const TABLE_MATERIAL_MODULES: readonly Type<unknown>[] =
	[
		...COMMON_MATERIAL_MODULES,
		MatTableModule,
		MatPaginatorModule,
		MatSortModule,
		MatChipsModule,
		MatTooltipModule,
		MatMenuModule,
		MatFormFieldModule,
		MatInputModule,
		MatCheckboxModule
	] as const;

/**
 * Dialog Material Modules Bundle
 * Modules for modal dialogs and notifications.
 *
 * Includes:
 * - Dialog containers
 * - Snack bars for notifications
 * - Buttons and icons
 *
 * Use for: Confirm dialogs, notifications, modals
 */
export const DIALOG_MATERIAL_MODULES: readonly Type<unknown>[] =
	[
		...COMMON_MATERIAL_MODULES,
		MatDialogModule,
		MatSnackBarModule
	] as const;

/**
 * Navigation Material Modules Bundle
 * Basic navigation components.
 *
 * Includes:
 * - Buttons and icons
 * - Tooltips
 * - Menus
 *
 * Use for: Headers, footers, navigation bars
 */
export const NAVIGATION_MATERIAL_MODULES: readonly Type<unknown>[] =
	[
		...COMMON_MATERIAL_MODULES,
		MatTooltipModule,
		MatMenuModule
	] as const;

/**
 * Stepper Material Modules Bundle
 * For multi-step wizard forms.
 *
 * Includes:
 * - Stepper component
 * - Form modules
 * - Progress indicators
 *
 * Use for: Multi-step user creation, wizards
 */
export const STEPPER_MATERIAL_MODULES: readonly Type<unknown>[] =
	[
		...COMMON_MATERIAL_MODULES,
		MatStepperModule,
		MatFormFieldModule,
		MatInputModule,
		MatCheckboxModule,
		MatCardModule
	] as const;

/**
 * Card Material Modules Bundle
 * For card-based layouts.
 *
 * Includes:
 * - Card components
 * - Dividers
 * - Buttons and icons
 *
 * Use for: Dashboard panels, content cards
 */
export const CARD_MATERIAL_MODULES: readonly Type<unknown>[] =
	[
		...COMMON_MATERIAL_MODULES,
		MatCardModule,
		MatDividerModule
	] as const;