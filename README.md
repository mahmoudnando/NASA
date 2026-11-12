# NASA Astronaut Health Monitoring System 🚀

An advanced, real-time spaceflight medical telemetry and astronaut health surveillance platform designed for deep-space missions (such as ARES-III / Artemis exploration). Built with a high-performance **.NET 9 + PostgreSQL + SignalR** backend architecture and a responsive **React 19 + TypeScript + Vite + Tailwind CSS** frontend featuring a crystalline cosmic glassmorphism user interface.

Supports dual-language internationalization (**Arabic RTL with Cairo font** and **English LTR with Plus Jakarta Sans**).

---

## ✨ Features & Capabilities

- **100% Backend Controller & Domain Coverage**:
  - **Astronaut Console**: Real-time summary status banner, biometric vital sign cards, 24-hour dynamic heart rate chart, and quick clinical actions.
  - **Flight Surgeon (Monitor) Dashboard**: Real-time fleet health overview across active missions, monitored astronauts, active emergency alerts, and individual biometric snapshots.
  - **Vitals Studio**: Continuous tracking and recording for all 6 key spaceflight metrics (`HR`, `SPO2`, `BP`, `TEMP`, `GLUCOSE`, `RESP`) with body position, activity context, and meal context metadata.
  - **Reference Ranges & Medical Guides**: Interactive clinically calibrated normal vs. medical attention vs. emergency ranges, plus 5 mission guidance questions per metric.
  - **Sleep Architecture Analysis**: Circadian rhythm, duration, efficiency percentage, and deep/REM/light sleep staging.
  - **Psychological Wellness (Mood & Stress)**: Emotional equilibrium tracking, stress level scoring, dominant emotion taxonomy, and longitudinal mood trends.
  - **Surgeon Clinical Directives (Recommendations)**: Lifecycle management (`Pending` → `Acknowledged` → `Completed` / `Dismissed`) with categorized priorities and action due dates.
  - **Symptom Guidance Engine**: Assessment across 18 clinical spaceflight symptoms (including Space Motion Sickness, SANS, Orthostatic Intolerance, and 3 critical Red Flags) mapped against 12 space conditions.
  - **Emergency Protocol System**: Real-time alerts with sound/haptic alarms, manual incident triggers, and rapid checklists for critical protocols (`EP-HYPOXIA-01`, `EP-CO2-02`).
  - **Ground-to-Orbit Telemedicine Chat**: Real-time bidirectional secure communication via SignalR (`/hubs/chat`).
  - **Crew & Mission Roster Management**: Space missions, crew member allocation, and deactivation safeguards.
  - **Medical Dossier & Offline Sync**: Full exportable medical reports and an offline batch synchronization bus (`/api/sync`) with client-generated GUID idempotency.

- **Role-Based Access Control (RBAC)**:
  - **`Astronaut`**: Focused exclusively on personal telemetry, personal recording, guides, symptom assessments, and direct flight surgeon chat.
  - **`Monitor` (Flight Surgeon)**: Multi-crew overview, mission management, issuing medical recommendations, and resolving emergency incidents.

- **Design System**:
  - High-depth translucent cosmic glassmorphism panels.
  - Dynamic directional feathered backdrop-blur layer that keeps the astronaut artwork sharp while soothing background visual noise behind data cards.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: .NET 9 Web API
- **Language**: C# 13
- **Database**: PostgreSQL 16 via Entity Framework Core 9 (Code-First Migrations)
- **Real-Time Engine**: ASP.NET Core SignalR (`/hubs/chat`, `/hubs/alerts`)
- **Authentication**: JWT Bearer Tokens with Refresh Token rotation and 30-second grace window
- **Security & Reliability**: Rate Limiting (`System.Threading.RateLimiting`), strict authorization policies (`AstronautOnly`, `MonitorOnly`)

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS with custom glassmorphism utilities
- **Typography**: Google Fonts `Cairo` (Arabic) & `Plus Jakarta Sans` (English)
- **Icons**: Lucide React
- **Real-Time Client**: `@microsoft/signalr`

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/) & `npm`
- [PostgreSQL 16](https://www.postgresql.org/) (or Docker)

### 2. Configure Environment
Copy the sample environment file and configure local credentials:
```bash
cp .env.example .env
```

### 3. Run Backend
```bash
cd Backend
dotnet restore
dotnet run
# API listens by default on http://localhost:5256
# Swagger documentation available at http://localhost:5256/swagger
```

### 4. Run Frontend
```bash
cd Frontend
npm install
npm run dev
# Vite dev server runs at http://localhost:3000
```

---

## 🐳 Docker Deployment

To launch the full stack (Database, Backend, and Frontend) in an isolated network:

```bash
docker compose up -d --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4050`
- **PostgreSQL**: Internal isolated bridge network (`nasa-astro-network`)

---

## 📄 License
This project is released under the MIT License.
