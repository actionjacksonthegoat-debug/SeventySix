import { z } from "zod";

/** Printful webhook event body shape. */
export type PrintfulWebhookBody = {
	type: string;
	data?: {
		order?: { id: number | string; };
		shipment?: { tracking_number?: string; carrier?: string; };
	};
};

/** Zod schema for validating Printful webhook event body. */
export const printfulWebhookBodySchema: z.ZodType<PrintfulWebhookBody> =
	z.object(
		{
			type: z.string(),
			data: z
				.object(
					{
						order: z
							.object(
								{
									id: z.union(
										[z.number(), z.string()])
								})
							.optional(),
						shipment: z
							.object(
								{
									tracking_number: z
										.string()
										.optional(),
									carrier: z
										.string()
										.optional()
								})
							.optional()
					})
				.optional()
		});