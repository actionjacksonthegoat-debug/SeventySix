export const environment = {
	production: false,
	apiUrl: "https://localhost:7074/api", // Default API URL for development
	logging: {
		enableRemoteLogging: true,
		batchSize: 10,
		batchInterval: 5000, // 5 seconds
		maxQueueSize: 100,
		maxRetryCount: 3,
		circuitBreakerThreshold: 5,
		circuitBreakerTimeout: 30000 // 30 seconds
	}
};
