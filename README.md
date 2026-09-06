# 🌱 AgroVision

> **"Your Farm. Your Vision. Your AI Assistant."**

AgroVision is an AI-powered wearable agricultural assistant for farmers, inspired by the interaction model of smart glasses (such as Ray-Ban Meta), designed specifically for agriculture and field management.

---

## 👓 The AgroVision Concept

- **Smart Glasses**: Hands-free interaction layer equipped with dual optics camera, quad microphones, open-ear speakers, GPS, and Bluetooth. The farmer communicates using the wake word: **“Hey Vision”**.
- **Mobile Device**: Acts as the intelligent local bridge between the wearable glasses and backend.
- **Web Application**: The farmer’s central farm-management, digital farm memory, crop-monitoring, geo-fencing, observation, task, alert, weather, and AI-assistant interface.

---

## 🚀 Key Features

### 1. 🚜 Interactive Geo-Fencing & Precision Farm Map
- Dedicated full-screen interactive Leaflet map with color-coded parcel health boundaries (*Healthy*, *At Risk*, *Critical*).
- **Point-in-Polygon Engine**: Automatically detects which field boundary the farmer is inside based on real-time RTK GPS coordinates.
- **Polygon Boundary Editor**: Drop coordinate vertices, calculate dynamic acreage, and save custom geo-fences.

### 2. 🌾 Personalized Farmer Central Dashboard
- Morning briefing audio summary: weather, today's tasks, and active alerts.
- Live current field telemetry, micro-climate weather card with foliar spraying advisory, active alerts, recent observations, and touch-friendly quick action buttons.

### 3. 🔬 Dedicated Agricultural Computer Vision Diagnostics
- Crop pathology detection pipeline evaluated by specialized agricultural CV models (`AgroVision-CropVision v3.2`).
- Provides confidence scoring (*e.g., Anthracnose 87%*), severity ranking, and actionable chemical/cultural treatment recommendations.

### 4. 🎙️ Hands-Free Voice Scouting & Media Vault
- Hands-free photo and 15s video capture triggered via voice.
- Records observations with voice notes, audio playback, transcripts, and GPS geo-tags.
- Automatically organizes media by: **Farm &rarr; Field &rarr; Crop &rarr; Date &rarr; Type**.

### 5. 🧠 Long-Term Digital Farm Memory
- Natural language retrieval engine answering farmer queries:
  - *“What did I record in my mango field yesterday?”*
  - *“What problem did I report last week?”*
  - *“When did I last inspect the tomato field?”*

### 6. 🤖 Conversational AgroVision AI Assistant
- Conversational chat interface with speech synthesis (Text-to-Speech) and microphone input.
- Automatically aware of the farmer's live farm context (*Current Farm, Field, Crop, and Geo-fence status*).

### 7. 👓 Smart Glasses Hardware Diagnostics (HUD)
- Telemetry monitor for battery (*78%*), Bluetooth 5.3, RTK GPS, dual optics camera, microphone array, open-ear speaker, and buffer synchronization.

### 8. 🎮 Interactive Hardware Simulator (Demo Mode)
- Built-in simulation bar for demonstrating the end-to-end wearable workflow without physical hardware:
  - **Simulate GPS Movement** (Enter Mango Plantation)
  - **Simulate Photo Capture**
  - **Simulate Voice Observation** (“Yellow leaves observed...”)
  - **Simulate Disease Alert** (Anthracnose Detected)
  - **Simulate Task Creation** (“Apply fertilizer tomorrow”)
  - **Simulate Morning Briefing**

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, Custom Agricultural Design Tokens
- **Mapping & Geo-fencing**: Leaflet, OpenStreetMap
- **Icons & UI Elements**: Lucide Icons, Canvas Confetti
- **Voice & Speech**: Web Speech API (`SpeechSynthesis` & `SpeechRecognition`), Web Audio API chimes

---

## 📦 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/MSN-2007/Agro_vision-.git
cd Agro_vision-

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production
```bash
npm run build
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
