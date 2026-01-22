# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["SeventySix.Api/SeventySix.Api.csproj", "SeventySix.Api/"]
COPY ["SeventySix.Domains/SeventySix.Domains.csproj", "SeventySix.Domains/"]
COPY ["SeventySix.Shared/SeventySix.Shared.csproj", "SeventySix.Shared/"]
RUN dotnet restore "./SeventySix.Api/SeventySix.Api.csproj"
COPY . .
WORKDIR "/src/SeventySix.Api"
RUN dotnet build "./SeventySix.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./SeventySix.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app

# Install required packages:
# - libgssapi-krb5-2: GSS-API Kerberos library for Npgsql authentication
# - curl: For healthcheck endpoint verification
USER root
RUN apt-get update && apt-get install -y libgssapi-krb5-2 curl && rm -rf /var/lib/apt/lists/*

# Create data protection keys directory with proper ownership
# This directory should be mounted as a Docker volume for key persistence
RUN mkdir -p /app/keys && chown $APP_UID:$APP_UID /app/keys
USER $APP_UID

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SeventySix.Api.dll"]