// <copyright file="Program.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// TODO Run this off of settings
// TODO Need logs
builder.Services.AddCors(
	options =>
	{
		options.AddPolicy(
			name: "localhost",
			policy =>
			{
				_ = policy
					.WithOrigins(
						"http://localhost:4200",
						"https://localhost:4200")
					.AllowAnyHeader()
					.AllowAnyHeader();
			});
	});

WebApplication app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	_ = app.MapOpenApi();

	// Scalar API reference UI
	_ = app.MapScalarApiReference();
}

app.UseCors("localhost");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
