/**
 * CreateLogRequest Test Data Builder
 * Simplifies creation of CreateLogRequest objects for testing
 * Follows Builder pattern for test data creation
 */

import { CreateLogRequest } from "@shared/models";
import { DateService } from "@shared/services";

/** Shared DateService instance for builders. */
const dateService: DateService =
	new DateService();

/**
 * Fluent builder for CreateLogRequest test data.
 * Provides sensible defaults while allowing customization.
 *
 * @example
 * const errorLog = new CreateLogRequestBuilder()
 *   .withMessage("User action failed")
 *   .withStackTrace("Error at line 42...")
 *   .build();
 *
 * @example
 * const warningLog = CreateLogRequestBuilder.warning()
 *   .withMessage("Slow API response")
 *   .build();
 */
export class CreateLogRequestBuilder
{
	private request: Partial<CreateLogRequest> =
		{
			logLevel: "Error",
			clientTimestamp: dateService.now()
		};

	/**
	 * Set log level to Error (default).
	 *
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	asError(): this
	{
		this.request.logLevel = "Error";
		return this;
	}

	/**
	 * Set log level to Warning.
	 *
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	asWarning(): this
	{
		this.request.logLevel = "Warning";
		return this;
	}

	/**
	 * Set log level to Information.
	 *
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	asInfo(): this
	{
		this.request.logLevel = "Information";
		return this;
	}

	/**
	 * Set the error message.
	 *
	 * @param {string} message
	 * Error message content.
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	withMessage(message: string): this
	{
		this.request.message = message;
		return this;
	}

	/**
	 * Set the stack trace.
	 *
	 * @param {string} stackTrace
	 * Stack trace string.
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	withStackTrace(stackTrace: string): this
	{
		this.request.stackTrace = stackTrace;
		return this;
	}

	/**
	 * Set the client timestamp.
	 *
	 * @param {string} timestamp
	 * ISO timestamp string.
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	withTimestamp(timestamp: string): this
	{
		this.request.clientTimestamp = timestamp;
		return this;
	}

	/**
	 * Set the request URL where error occurred.
	 *
	 * @param {string} requestUrl
	 * Request URL.
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	withRequestUrl(requestUrl: string): this
	{
		this.request.requestUrl = requestUrl;
		return this;
	}

	/**
	 * Set user agent string.
	 *
	 * @param {string} userAgent
	 * Browser user agent.
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	withUserAgent(userAgent: string): this
	{
		this.request.userAgent = userAgent;
		return this;
	}

	/**
	 * Set additional context data.
	 *
	 * @param {Record<string, unknown>} context
	 * Additional error context.
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	withAdditionalContext(context: Record<string, unknown>): this
	{
		this.request.additionalContext = context;
		return this;
	}

	/**
	 * Set HTTP status code (for HTTP errors).
	 *
	 * @param {number} code
	 * HTTP status code.
	 * @returns {this}
	 * Builder instance for chaining.
	 */
	withStatusCode(code: number): this
	{
		this.request.statusCode = code;
		return this;
	}

	/**
	 * Build the CreateLogRequest object.
	 *
	 * @returns {CreateLogRequest}
	 * Configured CreateLogRequest instance.
	 */
	build(): CreateLogRequest
	{
		return {
			logLevel: this.request.logLevel ?? "Error",
			message: this.request.message ?? "Test error message",
			clientTimestamp: this.request.clientTimestamp ?? dateService.now(),
			stackTrace: this.request.stackTrace,
			requestUrl: this.request.requestUrl,
			userAgent: this.request.userAgent,
			additionalContext: this.request.additionalContext,
			statusCode: this.request.statusCode
		};
	}

	/**
	 * Create an Error level log request with defaults.
	 *
	 * @returns {CreateLogRequestBuilder}
	 * Builder pre-configured for error.
	 */
	static error(): CreateLogRequestBuilder
	{
		return new CreateLogRequestBuilder()
			.asError();
	}

	/**
	 * Create a Warning level log request with defaults.
	 *
	 * @returns {CreateLogRequestBuilder}
	 * Builder pre-configured for warning.
	 */
	static warning(): CreateLogRequestBuilder
	{
		return new CreateLogRequestBuilder()
			.asWarning();
	}

	/**
	 * Create an Information level log request with defaults.
	 *
	 * @returns {CreateLogRequestBuilder}
	 * Builder pre-configured for info.
	 */
	static info(): CreateLogRequestBuilder
	{
		return new CreateLogRequestBuilder()
			.asInfo();
	}

	/**
	 * Create a default error log request.
	 *
	 * @returns {CreateLogRequest}
	 * Default CreateLogRequest instance.
	 */
	static default(): CreateLogRequest
	{
		return new CreateLogRequestBuilder()
			.build();
	}
}
