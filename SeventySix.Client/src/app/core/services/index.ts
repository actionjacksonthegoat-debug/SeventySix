/**
 * Core infrastructure services barrel export
 * ONLY exports infrastructure services, NOT feature services
 */

// Infrastructure services
export * from "./logger.service";
export * from "./notification.service";
export * from "./error-handler.service";
export * from "./error-queue.service";
export * from "./client-error-logger.service";
export * from "./cache.service";
export * from "./cache-config.service";
export * from "./sw-update.service";
export * from "./theme.service";
export * from "./layout.service";
export * from "./loading.service";
export * from "./viewport.service";

// DO NOT export feature services here
// Import directly from feature folders when needed:
// import { UserService } from '@admin/users/services';
// import { WeatherService } from '@home/weather/services';
