/**
 * Shared components barrel export
 *
 * NOTE: AltchaWidgetComponent and DataTableComponent are intentionally excluded.
 * AltchaWidgetComponent has a side-effect import (`import "altcha"`) that pulls 65KB into initial bundle.
 * DataTableComponent is only used in lazy-loaded admin pages — keeping it out saves ~25KB from initial.
 * Import them directly where needed:
 * `import { AltchaWidgetComponent } from "@shared/components/altcha-widget/altcha-widget";`
 * `import { DataTableComponent } from "@shared/components/data-table/data-table.component";`
 */

export { BreadcrumbComponent } from "./breadcrumb/breadcrumb.component";
export { CdnIconComponent } from "./cdn-icon/cdn-icon";
export { ConfirmDialogComponent } from "./confirm-dialog/confirm-dialog.component";
export { NotificationToastComponent } from "./notification-toast/notification-toast.component";
export { PageHeaderComponent } from "./page-header/page-header";
export { SessionWarningComponent } from "./session-warning/session-warning.component";