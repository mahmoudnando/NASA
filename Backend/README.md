# Astronaut Health Monitoring System (Backend API)

A resilient, offline-first mission telemetry and biometric health monitoring backend for human spaceflight missions. Built with **.NET 9 (C# 13)**, **Entity Framework Core 9**, and **PostgreSQL (Supabase)**.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Clone & Restore](#clone--restore)
3. [Local Configuration & User Secrets](#local-configuration--user-secrets)
4. [Database Migrations & Supabase Setup](#database-migrations--supabase-setup)
5. [Supabase Row Level Security (RLS)](#supabase-row-level-security-rls)
6. [Demo Seed Data](#demo-seed-data)
7. [Running the Application](#running-the-application)
8. [Running Tests](#running-tests)
9. [Default Ports & Endpoints](#default-ports--endpoints)
10. [Linux Quick-Start & Production Considerations](#linux-quick-start--production-considerations)
11. [Project Documentation](#project-documentation)

---

## Prerequisites

- **[.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)** (v9.0.100 or higher)
- **[Git](https://git-scm.com/)**
- **PostgreSQL Database** (PostgreSQL 15+ or a [Supabase](https://supabase.com) project)
- *(Optional)* **Docker** / **Docker Compose** if running PostgreSQL locally

---

## Clone & Restore

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-org-or-username>/Health-Monitoring.git
   cd Health-Monitoring
   ```

2. Restore NuGet dependencies:
   ```bash
   dotnet restore
   ```

3. Restore local .NET CLI tools (includes `dotnet-ef` v9.0.2 matching EF Core packages):
   ```bash
   dotnet tool restore
   ```

---

## Local Configuration & User Secrets

Sensitive configuration (database credentials, JWT signing keys, demo user seed passwords) must **never** be committed to version control. The repository tracks empty placeholders in `appsettings.json`.

The project is configured with User Secrets ID `1d278b6f-c597-48f2-a0bb-0b760e392ee8`.

### Initializing User Secrets

Configure required secrets locally using the .NET CLI:

```bash
# 1. Database Connection String (PostgreSQL or Supabase Session Pooler)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=your-supabase-host;Port=5432;Database=postgres;Username=postgres;Password=YOUR_SECURE_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"

# 2. JWT Signing Key (Must be at least 32 characters / 256 bits long)
dotnet user-secrets set "Jwt:Key" "YOUR_CRYPTO_SECURE_JWT_SIGNING_KEY_MIN_32_CHARS!"

# 3. Demo User Seed Passwords (required if seeding is active)
dotnet user-secrets set "SeedUsers:Astronauts:0:Password" "Astro123!Vance"
dotnet user-secrets set "SeedUsers:Astronauts:1:Password" "Astro123!Lee"
dotnet user-secrets set "SeedUsers:Astronauts:2:Password" "Astro123!Quinn"
dotnet user-secrets set "SeedUsers:Monitor:Password" "Monitor123!Rivera"

# Optional: Alternatively set a single fallback password for all astronauts
# dotnet user-secrets set "SeedUsers:Astronaut:Password" "Astro123!Shared"
```

> [!WARNING]
> **Environment Variables vs User Secrets Precedence**:
> In ASP.NET Core, Environment Variables are loaded **after** User Secrets. If you have an empty or stale `ConnectionStrings__DefaultConnection` variable set in your shell environment, it will override and hide the value saved in your user-secrets file. Verify your shell environment if connection issues occur.

---

## Database Migrations & Supabase Setup

Migrations are managed via the local `dotnet-ef` tool manifest.

### Applying Migrations

Run database updates using the restored local tool:

```bash
dotnet tool run dotnet-ef database update --context AppDbContext
```

### Supabase Connection Pooling Notes

Supabase provides two connection pooler ports via Supavisor, plus direct database connections:
- **Session Mode (Port 5432)**: **Recommended for EF Core and Migrations.** Supports schema DDL modifications, prepared statements, and transactional state.
- **Direct Connection (Port 5432 on db.[ref].supabase.co)**: Fully supported for migrations if IPv6 is supported on your network.
- **Transaction Mode (Port 6543)**: **Do NOT use for `dotnet-ef database update`.** Transaction mode does not support DDL operations or prepared statement resets required by migration runners. If using Transaction mode at runtime, add `No Reset On Close=true;Max Auto Prepare=0;` to the connection string.

---

## Supabase Row Level Security (RLS)

If using Supabase, the Supabase Security Advisor may show warnings that newly migrated ASP.NET Core Identity and token tables do not have Row Level Security enabled.

Because this ASP.NET Core Web API acts as a secure, trusted backend accessing PostgreSQL via Npgsql (with full role-based authorization implemented in C# via JWT and ASP.NET Core Identity), direct public PostgREST access should either be disabled or guarded by RLS.

To enable RLS on all Identity and token tables in Supabase SQL Editor:

```sql
-- Enable RLS to satisfy Supabase security advisories and block public PostgREST access
ALTER TABLE "AspNetUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetRoles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserRoles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserClaims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserLogins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserTokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetRoleClaims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshTokens" ENABLE ROW LEVEL SECURITY;

-- Note: The ASP.NET Core backend connects as the database owner ('postgres'),
-- which bypasses RLS by default and continues normal read/write operations.
```

If you ever need to disable RLS for testing:
```sql
ALTER TABLE "AspNetUsers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetRoles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserRoles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserClaims" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserLogins" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetUserTokens" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AspNetRoleClaims" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshTokens" DISABLE ROW LEVEL SECURITY;
```

---

## Demo Seed Data

The application includes an automated seeder (`IdentityDataSeeder`) for demo and development environments:
- **1 Mission**: "Ares V - Deep Space Exploration"
- **3 Demo Astronauts**:
  - `astro.vance` / `morgan.vance@mission.space` (Code: `AST-001`, assigned to mission)
  - `astro.lee` / `jordan.lee@mission.space` (Code: `AST-002`, assigned to mission)
  - `astro.quinn` / `taylor.quinn@mission.space` (Code: `AST-003`, assigned to mission)
- **1 Demo Flight Support Monitor**:
  - `monitor.rivera` / `casey.rivera@missioncontrol.space`

### Controlling Seeding Behavior
- **Default in Development**: Runs automatically on application startup.
- **Fail-Fast Validation**: If required password secrets or `Jwt:Key` are missing when seeding runs, startup halts immediately with a clear exception naming the missing keys.
- **Explicit Override**: You can enable or disable seeding via `appsettings.json` or user-secrets:
  ```json
  "SeedData": {
    "Enabled": false
  }
  ```

---

## Running the Application

### Option A: Standard HTTPS Profile
```bash
dotnet run
```
Default URL: `https://localhost:7012` and `http://localhost:5256`

### Option B: HTTP Only Profile (No Local Dev Certificate Required)
Recommended on headless Linux servers or CI containers to avoid HTTPS certificate trust setup:
```bash
dotnet run --launch-profile http
```
Default URL: `http://localhost:5256`

---

## Running Tests

Run the full xUnit test suite (unit tests, status evaluation engine, validators, Mapster mappings, auth policies):

```bash
dotnet test
```

For verbose output with passed test details:
```bash
dotnet test --logger "console;verbosity=normal"
```

---

## Default Ports & Endpoints

| Endpoint / Feature | URL / Path | Access / Policy |
| :--- | :--- | :--- |
| **HTTP Base URL** | `http://localhost:5256` | Public |
| **HTTPS Base URL** | `https://localhost:7012` | Public |
| **Health Check** | `GET /health` | Public (Anonymous DB probe) |
| **OpenAPI v1 Document** | `http://localhost:5256/openapi/v1.json` | Development Only |
| **Swagger UI** | `http://localhost:5256/swagger` | Development Only |
| **Auth: Login** | `POST /api/auth/login` | Public (Rate-limited: 5 requests/min) |
| **Auth: Refresh Token** | `POST /api/auth/refresh` | Public |
| **Auth: Revoke Token** | `POST /api/auth/revoke` | Public |
| **Auth: Current User** | `GET /api/auth/me` | Authenticated (`Bearer`) |
| **Vital Signs: Record** | `POST /api/vitalsigns` | AstronautOnly |
| **Vital Signs: Latest** | `GET /api/vitalsigns/latest` | Authenticated (scoped) |
| **Vital Signs: History** | `GET /api/vitalsigns/history` | Authenticated (scoped) |
| **Vital Signs: Get By Id** | `GET /api/vitalsigns/{id}` | Authenticated (scoped) |
| **Alerts: List** | `GET /api/alerts` | Authenticated (scoped) |
| **Alerts: Get By Id** | `GET /api/alerts/{id}` | Authenticated (scoped) |
| **Alerts: Trigger Manual** | `POST /api/alerts/manual` | Authenticated (scoped, rate-limited) |
| **Alerts: Acknowledge** | `POST /api/alerts/{id}/acknowledge` | MonitorOnly |
| **Alerts: Resolve** | `POST /api/alerts/{id}/resolve` | MonitorOnly |
| **Sleep: Record** | `POST /api/sleep` | AstronautOnly |
| **Sleep: Latest** | `GET /api/sleep/latest` | Authenticated (scoped) |
| **Sleep: History** | `GET /api/sleep/history` | Authenticated (scoped) |
| **Sleep: Get By Id** | `GET /api/sleep/{id}` | Authenticated (scoped) |
| **Mood: Record** | `POST /api/mood` | AstronautOnly |
| **Mood: Latest** | `GET /api/mood/latest` | Authenticated (scoped) |
| **Mood: History** | `GET /api/mood/history` | Authenticated (scoped) |
| **Mood: Get By Id** | `GET /api/mood/{id}` | Authenticated (scoped) |
| **Astronauts: Provision** | `POST /api/astronauts` | MonitorOnly |
| **Astronauts: List** | `GET /api/astronauts` | MonitorOnly |
| **Astronauts: Current Me** | `GET /api/astronauts/me` | AstronautOnly |
| **Astronauts: Get By Id** | `GET /api/astronauts/{id}` | Authenticated (scoped) |
| **Astronauts: Update** | `PUT /api/astronauts/{id}` | MonitorOnly |
| **Astronauts: Deactivate** | `PATCH /api/astronauts/{id}/deactivate` | MonitorOnly |
| **Missions: List** | `GET /api/missions` | Authenticated |
| **Missions: Get By Id** | `GET /api/missions/{id}` | Authenticated |
| **Missions: Create** | `POST /api/missions` | MonitorOnly |
| **Missions: Update** | `PUT /api/missions/{id}` | MonitorOnly |
| **Missions: Delete** | `DELETE /api/missions/{id}` | MonitorOnly |
| **Missions: Assign** | `POST /api/missions/{id}/astronauts` | MonitorOnly |
| **Missions: Unassign** | `DELETE /api/missions/{id}/astronauts/{astronautId}` | MonitorOnly |
| **Dashboard: Monitor** | `GET /api/dashboard/monitor` | MonitorOnly |
| **Dashboard: Snapshot** | `GET /api/dashboard/astronauts/{id}` | MonitorOnly |
| **Dashboard: My Dashboard** | `GET /api/dashboard/me` | AstronautOnly |
| **Recommendations: List** | `GET /api/recommendations` | Authenticated (scoped) |
| **Recommendations: Get By Id** | `GET /api/recommendations/{id}` | Authenticated (scoped) |
| **Recommendations: Create** | `POST /api/recommendations` | MonitorOnly |
| **Recommendations: Update Status** | `PATCH /api/recommendations/{id}/status` | Authenticated (scoped) |
| **Symptoms: Catalog** | `GET /api/symptoms` | Authenticated |
| **Symptoms: Guidance** | `GET /api/symptoms/guidance` | Authenticated |
| **Symptoms: Assess** | `POST /api/symptoms/assess` | Authenticated (scoped) |
| **Chat: Messages** | `GET /api/chat/messages` | Authenticated (scoped) |
| **Chat: Send Message** | `POST /api/chat/messages` | Authenticated (scoped) |
| **Chat: Mark As Read** | `POST /api/chat/messages/{id}/read` | Authenticated (scoped) |
| **Chat: Unread Count** | `GET /api/chat/unread-count` | Authenticated (scoped) |
| **Sync: Telemetry Batch** | `POST /api/sync` | AstronautOnly |
| **SignalR Alerts Hub** | `/hubs/alerts?access_token=...` | Authenticated (`Bearer`) |
| **SignalR Chat Hub** | `/hubs/chat?access_token=...` | Authenticated (`Bearer`) |

---

## Linux Quick-Start & Production Considerations

### 1. File & Directory Paths
All paths in the solution use cross-platform forward slashes (`/`). Linux filesystems are case-sensitive; file casing exactly matches C# namespaces and type definitions.

### 2. Environment Variables (`__` syntax)
Linux and Unix shells do not support colons (`:`) in environment variable names. Use double underscores (`__`) instead of `:` when passing configuration:
```bash
export ConnectionStrings__DefaultConnection="Host=your-supabase-host;Port=5432;Database=postgres;Username=postgres;Password=YOUR_SECURE_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"
export Jwt__Key="YOUR_CRYPTO_SECURE_JWT_SIGNING_KEY_MIN_32_CHARS!"
export SeedUsers__Astronauts__0__Password="Astro123!Vance"
export SeedUsers__Astronauts__1__Password="Astro123!Lee"
export SeedUsers__Astronauts__2__Password="Astro123!Quinn"
export SeedUsers__Monitor__Password="Monitor123!Rivera"
```

### 3. User Secrets Location on Linux
On Linux, user-secrets are stored at:
```bash
~/.microsoft/usersecrets/1d278b6f-c597-48f2-a0bb-0b760e392ee8/secrets.json
```

### 4. HTTPS & Dev Certificates on Linux
To trust the .NET development certificate on Linux:
```bash
dotnet dev-certs https --trust
```
If running in a Docker container or WSL environment without GUI certificate stores, run using the HTTP profile:
```bash
dotnet run --launch-profile http
```

---

## Project Documentation

Detailed architecture and design documentation is available in the [`docs/`](./docs) directory:
- [**Frontend API Documentation & Integration Guide**](./docs/API-Documentation.md): Comprehensive guide for frontend engineers covering authentication lifecycles, full endpoint schemas, ProblemDetails envelopes, SignalR hubs, offline sync protocols, and screen mapping.
- [**Project Status Report & MVP Audit**](./docs/Project-Status.md): Complete analysis across all 20 system areas, execution roadmap, medical provenance audit, and open architectural decisions.
- [**Data Model & Relationships Guide**](./docs/Relationships.md): Exhaustive ER diagram, table-by-table foreign key specs, cascade delete behaviors, and offline sync idempotency indexes.
