import { describe, expect, it } from "vitest";
import { getProviderMetadata, type OAuthProvider } from "./auth.types";

describe("auth.types",
	() =>
	{
		describe("getProviderMetadata",
			() =>
			{
				it("should return metadata for a known provider",
					() =>
					{
						const result: ReturnType<typeof getProviderMetadata> =
							getProviderMetadata("github");

						expect(result)
							.toBeDefined();
						expect(result?.id)
							.toBe("github");
					});

				it("should return undefined for an unknown provider",
					() =>
					{
						const result: ReturnType<typeof getProviderMetadata> =
							getProviderMetadata("unknown" as OAuthProvider);

						expect(result)
							.toBeUndefined();
					});
			});
	});