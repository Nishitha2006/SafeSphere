🛡️ SafeSphere — Intelligent Women Safety System

SafeSphere is an AI-powered web safety platform that provides:

📍 Real-time GPS tracking

🗺️ AI-driven safety intelligence map

🚨 Smart SOS system

🎤 Voice-trigger emergency activation

🎥 Evidence recording

📤 Live location sharing

⏱ Smart check-in automation

🎬 Demo mode for simulation

It combines modern web APIs with AI-generated real-world safety data.

🚀 How to Clone & Run the Project
1️⃣ Clone the Repository
git clone https://github.com/YOUR-USERNAME/SafeSphere.git
cd SafeSphere

🖥️ Running the Frontend (Main Application)

This project uses fetch() to load areas.json, so you must run it using a local server.

❌ Do NOT open index.html directly

It will break due to browser security (CORS).

✅ Start a Local Server (Recommended)

If you have Python installed:

python3 -m http.server 8000


Then open in browser:

http://localhost:8000/index.html

📁 Required Folder Structure

Make sure your project looks like this:

SafeSphere/
│
├── index.html
├── script.js
├── data.js
├── style.css
├── areas.json
├── assets/
└── articles/


areas.json must be in the same folder as index.html.

🧠 Running the AI Data Extraction Script (Optional)

If you want to regenerate risk zones from articles:

Step 1 — Create Virtual Environment
python3 -m venv venv


Activate it:

Mac / Linux
source venv/bin/activate

Windows
venv\Scripts\activate

Step 2 — Install Dependencies
pip install openai requests python-dotenv

Step 3 — Add Your OpenAI API Key

Create a .env file:

OPENAI_API_KEY=your_api_key_here

Step 4 — Run Data Extraction
python main.py


This will:

Read articles from /articles

Extract risk zones

Geocode locations

Generate areas.json

🗺️ AI Risk Intelligence Map

The application loads real-world safety zones from areas.json.

Zones are color-coded:

Color	Risk Level
🟢 Green	Low Risk
🟡 Yellow	Medium Risk
🔴 Red	High Risk

Risk scoring is dynamically calculated using:

Distance from danger zones

Crime severity

Population density

Lighting conditions

Time-of-day multiplier

🚨 Smart SOS System

Emergency workflow:

User presses SOS

5-second countdown begins

If not cancelled → alarm activates

Alert is logged

🎤 Voice Activation

Uses Web Speech Recognition API.

Recognizes keywords:

“Help”

“Emergency”

Triggers SOS automatically.

🎥 Evidence Mode

Records audio evidence using the MediaRecorder API.

After stopping:

File is automatically downloaded locally

Evidence is timestamped

📤 Live Location Sharing

Generates:

Google Maps link

Coordinates

Uses Web Share API (with clipboard fallback)

⏱ Smart Check-In

If user does not confirm safety before timer ends:

→ SOS is triggered automatically.

🎬 Demo Mode

Simulates movement through:

Real high-risk zones

Real medium-risk zones

Useful for:

Hackathon presentations

Feature demonstrations

Testing without physical movement

🧰 Technology Stack
Frontend

HTML5

CSS3

JavaScript (ES6)

APIs

Leaflet.js

Geolocation API

Speech Recognition API

MediaRecorder API

Web Share API

Data Layer

AI-generated areas.json

OpenStreetMap geocoding

Python-based extraction pipeline

⚠️ Browser Requirements

Recommended:

Google Chrome

Microsoft Edge

Required permissions:

Location

Microphone (for Evidence & Voice)

🔐 Security Note

This project runs fully on the frontend.
No backend storage is currently implemented.
All evidence recordings are stored locally.

🎯 Future Improvements

Backend API integration

Real-time database logging

Heatmap toggle

User authentication

Cloud evidence storage

SMS-based emergency alerts
