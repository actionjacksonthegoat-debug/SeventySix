// See https://svelte.dev/docs/kit/types#app.d.ts
declare global
{
	namespace App
	{
		interface Locals
		{
			/** Anonymous cart session ID from HTTP-only cookie. */
			cartSessionId: string;
			/** W3C trace ID extracted from the incoming traceparent header. */
			traceId?: string;
			/** W3C span ID extracted from the incoming traceparent header. */
			spanId?: string;
		}
	}
}

export {};