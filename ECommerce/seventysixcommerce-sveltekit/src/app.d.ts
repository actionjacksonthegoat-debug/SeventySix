// See https://svelte.dev/docs/kit/types#app.d.ts
declare global
{
	namespace App
	{
		interface Locals
		{
			/** Anonymous cart session ID from HTTP-only cookie. */
			cartSessionId: string;
		}
	}
}

export {};