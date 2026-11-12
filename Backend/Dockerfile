# ── Stage 1: Build & Publish .NET 9 Web API ──
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["AstronautHealthMonitoring.csproj", "./"]
RUN dotnet restore "AstronautHealthMonitoring.csproj"

COPY . .
RUN dotnet publish "AstronautHealthMonitoring.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ── Stage 2: Production ASP.NET Core 9 Runtime ──
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["dotnet", "AstronautHealthMonitoring.dll"]

