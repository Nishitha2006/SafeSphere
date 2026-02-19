🛡️ SafeSphere — Intelligent Women Safety System

SafeSphere is an AI-powered web safety platform designed to enhance personal security using modern web technologies and intelligent risk modeling.

It combines real-time GPS tracking, AI-driven safety analysis, and emergency automation features into a unified safety dashboard.

🌟 Features

📍 Real-time GPS tracking

🗺️ AI-driven safety intelligence map

🚨 Smart SOS system with countdown

🎤 Voice-trigger emergency activation

🎥 Evidence recording (audio capture)

📤 Live location sharing

⏱ Smart check-in automation

🎬 Demo mode for simulation and testing

🚀 How to Clone & Run the Project
1️⃣ Clone the Repository
git clone https://github.com/YOUR-USERNAME/SafeSphere.git
cd SafeSphere

🖥️ Running the Frontend (Main Application)

This project uses fetch() to load areas.json.
You must run it using a local server.

❌ Do NOT open index.html directly
It will fail due to browser CORS security restrictions.

✅ Start a Local Server (Recommended)

If Python is installed:

python3 -m http.server 8000


Then open in your browser:

http://localhost:8000/index.html

📁 Required Folder Structure
SafeSphere/
│
├── index.html
├── script.js
├── data.js
├── style.css
├── areas.json
├── assets/
└── articles/


areas.json must be in the same directory as index.html.

🧠 AI Data Extraction Pipeline (Optional)

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

Risk Zone Colors
Color	Risk Level
🟢 Green	Low Risk
🟡 Yellow	Medium Risk
🔴 Red	High Risk
Risk Scoring Factors

Risk score is dynamically calculated using:

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

Recognized keywords:

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

Uses:

Web Share API

Clipboard fallback

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
