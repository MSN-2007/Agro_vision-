# AgroVision

AgroVision is an agricultural operations and field management application with voice interaction, GPS boundary tracking, and real-time weather analytics.

## Architecture

- **Field Companion Interface**: Smartphone voice input and camera capture for scouting notes and geotagged field media.
- **Geospatial Engine**: Ray-casting point-in-polygon boundary detection with Leaflet parcel mapping.
- **Meteorological Layer**: Live Open-Meteo forecasts with temperature, humidity, rain probability, wind speed, and foliar spray advisories.
- **Web Console**: Field telemetry, scouting records, task scheduling, and voice assistant history.

## Core Capabilities

### 1. Field Boundaries and Precision Mapping
- Interactive Leaflet map displaying parcel boundaries with health classifications (Healthy, At Risk, Critical).
- Ray-casting point-in-polygon engine determines the active field from device GPS coordinates.
- Boundary editor lets operators add coordinate vertices, calculate acreage, and register new parcel polygons.

### 2. Operations Overview
- Daily briefing summarizes local weather, pending work orders, and unresolved scouting alerts.
- Live telemetry card displays current field conditions, weather metrics, and foliar spray suitability.

### 3. Voice Scouting and Media Records
- Browser SpeechRecognition records notes directly through the device microphone.
- Photo capture attaches GPS coordinates, timestamp, crop type, and field identifier to every record.
- Media library indexes files by farm, field, crop, and date.

### 4. Search and Records Retrieval
- Natural language query interface retrieves historical scouting notes, task logs, and weather history.
- Field records maintain strict data isolation across distinct farm parcels.

### 5. AgroVision Voice Assistant
- Web Speech API speech-to-text and speech synthesis support two-way voice communication.
- Queries automatically inherit the active field and weather context.

### 6. Simulation Sandbox
- Developer sandbox tests GPS coordinate shifts, photo capture events, and weather thresholds without field hardware.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet, OpenStreetMap
- **Audio & Speech**: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`), Web Audio API

## Getting Started Locally

### Prerequisites
- Node.js 18 or higher
- npm

### Installation

```bash
git clone https://github.com/MSN-2007/Agro_vision-.git
cd Agro_vision-
npm install
npm run dev
```

The application runs locally on [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
```

## License

MIT
