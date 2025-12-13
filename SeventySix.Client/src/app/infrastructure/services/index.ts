/**
 * Core infrastructure services barrel export
 * ONLY exports infrastructure services, NOT feature services
 */

// Infrastructure services
export * from "./auth.service";
export * from "./base-filter.service";
export * from "./base-mutation.service";
export * from "./client-error-logger.service";
export * from "./date.service";
export * from "./dialog.service";
export * from "./error-handler.service";
export * from "./error-queue.service";
export * from "./layout.service";
export * from "./loading.service";
export * from "./logger.service";
export * from "./notification.service";
export * from "./sanitization.service";
export * from "./storage.service";
export * from "./sw-update.service";
export * from "./telemetry.service";
export * from "./theme.service";
export * from "./web-vitals.service";

// DO NOT export feature services here
// Import directly from feature folders when needed:
// import { UserService } from '@admin/users/services';
