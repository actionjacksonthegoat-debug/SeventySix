// <copyright file="MessageResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.POCOs;

/// <summary>
/// Generic message response DTO for simple API responses.
/// </summary>
/// <param name="Message">
/// The message to return to the client.
/// </param>
public record MessageResponse(string Message);