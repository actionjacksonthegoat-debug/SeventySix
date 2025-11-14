/**
 * Health status models
 * Matches HealthStatusResponse and related DTOs from backend
 */
export interface HealthStatus
{
	status: string;
	checkedAt: string;
	database: DatabaseHealth;
	externalApis: ExternalApiHealth;
	errorQueue: QueueHealth;
	system: SystemResources;
}

export interface DatabaseHealth
{
	isConnected: boolean;
	responseTimeMs: number;
	activeConnections: number;
	status: string;
}

export interface ExternalApiHealth
{
	apis: Record<string, ApiHealthStatus>;
}

export interface ApiHealthStatus
{
	apiName: string;
	isAvailable: boolean;
	responseTimeMs: number;
	lastChecked: string | null;
}

export interface QueueHealth
{
	queuedItems: number;
	failedItems: number;
	circuitBreakerOpen: boolean;
	status: string;
}

export interface SystemResources
{
	cpuUsagePercent: number;
	memoryUsedMb: number;
	memoryTotalMb: number;
	diskUsagePercent: number;
}
