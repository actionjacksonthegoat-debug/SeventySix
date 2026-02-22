// <copyright file="CreateClientLogBatchCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging.Commands.CreateClientLogBatch;

/// <summary>
/// Command to create a batch of client-side log entries.
/// </summary>
/// <param name="Requests">
/// The array of client log creation requests.
/// </param>
public sealed record CreateClientLogBatchCommand(CreateLogRequest[] Requests);