// <copyright file="DeleteLogsBatchCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Command to delete multiple log entries by their IDs.
/// </summary>
/// <param name="Ids">The array of log IDs to delete.</param>
public record DeleteLogsBatchCommand(int[] Ids);