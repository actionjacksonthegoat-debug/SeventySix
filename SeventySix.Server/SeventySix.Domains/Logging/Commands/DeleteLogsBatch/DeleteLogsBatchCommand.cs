// <copyright file="DeleteLogsBatchCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Command to delete multiple log entries in a batch.
/// </summary>
/// <param name="LogIds">
/// The array of log IDs to delete.
/// </param>
public record DeleteLogsBatchCommand(long[] LogIds);