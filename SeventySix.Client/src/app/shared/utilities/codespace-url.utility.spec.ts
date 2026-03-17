import { resolveCodespaceUrl } from "./codespace-url.utility";

describe("resolveCodespaceUrl",
	() =>
	{
		it("should return configured URL unchanged on localhost hostname",
			() =>
			{
				const result: string =
					resolveCodespaceUrl("https://localhost:3443", "localhost");

				expect(result)
					.toBe("https://localhost:3443");
			});

		it("should return relative sub-path unchanged (production)",
			() =>
			{
				const result: string =
					resolveCodespaceUrl("/grafana", "my-app.example.com");

				expect(result)
					.toBe("/grafana");
			});

		it("should remap localhost URL to Codespaces forwarded URL",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"https://localhost:3443",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("https://my-codespace-3443.app.github.dev");
			});

		it("should remap Jaeger port (16687) correctly",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"https://localhost:16687",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("https://my-codespace-16687.app.github.dev");
			});

		it("should remap Prometheus port (9091) correctly",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"https://localhost:9091",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("https://my-codespace-9091.app.github.dev");
			});

		it("should remap pgAdmin port (5051) correctly",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"https://localhost:5051",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("https://my-codespace-5051.app.github.dev");
			});

		it("should remap RedisInsight port (5541) correctly",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"https://localhost:5541",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("https://my-codespace-5541.app.github.dev");
			});

		it("should remap Scalar URL preserving path suffix",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"https://localhost:7074/scalar/v1",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("https://my-codespace-7074.app.github.dev/scalar/v1");
			});

		it("should return URL unchanged for non-Codespaces hostname",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"https://localhost:3443",
						"my-server.azure.com");

				expect(result)
					.toBe("https://localhost:3443");
			});

		it("should return URL unchanged when no port in configured URL",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"/grafana",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("/grafana");
			});

		it("should handle HTTP protocol URLs and remap to HTTPS",
			() =>
			{
				const result: string =
					resolveCodespaceUrl(
						"http://localhost:3000",
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBe("https://my-codespace-3000.app.github.dev");
			});

		it("should return undefined when configured URL is undefined",
			() =>
			{
				const result: string | undefined =
					resolveCodespaceUrl(
						undefined,
						"my-codespace-4200.app.github.dev");

				expect(result)
					.toBeUndefined();
			});
	});