/**
 * Third-party API request models
 * Matches ThirdPartyApiRequestResponse and ThirdPartyApiStatisticsResponse DTOs from backend
 */
export interface ThirdPartyApiRequest
{
	id: number;
	apiName: string;
	baseUrl: string;
	callCount: number;
	lastCalledAt: string | null;
	resetDate: string;
}

export interface ThirdPartyApiStatistics
{
	totalCallsToday: number;
	totalApisTracked: number;
	callsByApi: Record<string, number>;
	lastCalledByApi: Record<string, string | null>;
}
