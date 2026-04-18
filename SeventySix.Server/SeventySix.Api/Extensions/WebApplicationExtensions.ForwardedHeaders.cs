// <copyright file="WebApplicationExtensions.ForwardedHeaders.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Pipeline extensions that configure forwarded-header handling for
/// reverse-proxy deployments.
/// </summary>
public static partial class WebApplicationExtensions
{
	/// <summary>Configures forwarded headers for reverse proxy scenarios.</summary>
	/// <remarks>
	/// Reads configuration section: ForwardedHeadersSettings.SectionName (known proxies, known networks, forward limit).
	/// Ensures proper IP and proto forwarding when the app is behind a reverse proxy/load balancer.
	/// </remarks>
	/// <param name="app">
	/// The web application.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The web application for chaining.
	/// </returns>
	public static WebApplication UseConfiguredForwardedHeaders(
		this WebApplication app,
		IConfiguration configuration)
	{
		ForwardedHeadersSettings settings =
			configuration
				.GetSection(ForwardedHeadersSettings.SectionName)
				.Get<ForwardedHeadersSettings>()
			?? new ForwardedHeadersSettings();

		ForwardedHeadersOptions options =
			new()
			{
				ForwardedHeaders =
					ForwardedHeaders.XForwardedFor
						| ForwardedHeaders.XForwardedProto,
				ForwardLimit = settings.ForwardLimit,
			};

		foreach (IPAddress? ip in settings.KnownProxies
			.Select(
				proxy =>
					IPAddress.TryParse(
						proxy,
						out IPAddress? parsed)
						? parsed
						: null)
			.Where(ip => ip is not null))
		{
			options.KnownProxies.Add(ip!);
		}

		foreach (System.Net.IPNetwork network in settings.KnownNetworks
			.Select(
				networkStr =>
				{
					string[] parts =
						networkStr.Split('/');
					return parts.Length == 2
						&& IPAddress.TryParse(
							parts[0],
							out IPAddress? prefix)
						&& int.TryParse(
							parts[1],
							out int prefixLength)
						? (System.Net.IPNetwork?)new System.Net.IPNetwork(
							prefix,
							prefixLength)
						: null;
				})
			.Where(networkCandidate => networkCandidate.HasValue)
			.Select(networkCandidate => networkCandidate!.Value))
		{
			options.KnownIPNetworks.Add(network);
		}

		app.UseForwardedHeaders(options);

		return app;
	}
}