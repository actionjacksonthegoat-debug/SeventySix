// <copyright file="CreateClientLogBatchCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Command to create multiple client-side log entries in a batch.
/// </summary>
/// <param name="Requests">The collection of log creation requests.</param>
public record CreateClientLogBatchCommand(CreateLogRequest[] Requests);
