# SafeSphere 🛡️ — Intelligent Women Safety System

SafeSphere is an AI-assisted web-based safety platform designed to enhance personal security through real-time location tracking, intelligent risk modeling, and automated emergency response mechanisms.

It integrates modern browser APIs with AI-generated safety datasets to provide contextual risk awareness and emergency automation.

## 🌟 Overview

SafeSphere provides:
- **Real-time GPS tracking**
- **AI-driven risk intelligence mapping**
- **Smart SOS system** with countdown protection
- **Voice-triggered emergency activation**
- **Audio evidence recording**
- **Live location sharing**
- **Automated safety check-in**
- **Simulation mode** for testing and demonstrations

The system operates entirely on the frontend, with optional AI-based data extraction for generating safety zones.

## 🚀 Getting Started

### Clone the Repository
```bash
git clone https://github.com/YOUR-USERNAME/SafeSphere.git
cd SafeSphere
```

### Running the Application

SafeSphere loads `areas.json` using `fetch()`, which requires serving the project through a local server.
**Do not open `index.html` directly in the browser**, as CORS restrictions will prevent proper data loading.

**Start a Local Server (Python):**
```bash
python3 -m http.server 8000
```

**Open in browser:**
[http://localhost:8000/index.html](http://localhost:8000/index.html)

## 📂 Project Structure

```
SafeSphere/
│
├── index.html        # Main interface
├── script.js         # Core logic and risk engine
├── data.js           # Data layer
├── style.css         # UI styling
├── areas.json        # AI-generated risk zones
├── assets/           # Audio and media files
└── articles/         # Source content for AI extraction
```

> **Note**: `areas.json` must remain in the same directory as `index.html`.

## 🧠 Risk Intelligence Model

Risk scoring is dynamically calculated based on:
- Proximity to identified danger zones
- Crime severity weighting
- Population density factors
- Lighting conditions
- Time-of-day multipliers

**Zones are color-coded:**
| Risk Level | Color  |
| --- | --- |
| Low | Green  |
| Medium | Yellow |
| High | Red |

## 🚨 Emergency Workflow

### Smart SOS
1. User activates SOS
2. 5-second countdown begins
3. If not cancelled, alarm is triggered
4. Incident is logged

### Voice Activation
The system uses the **Web Speech Recognition API** to detect emergency keywords such as:
- "Help"
- "Emergency"

*Detected keywords automatically trigger SOS.*

### Evidence Mode
- Uses the **MediaRecorder API** to capture audio evidence.
- Recording is stored locally.
- File is timestamped.
- *No backend storage is currently implemented.*

### Location Sharing
- Generates a Google Maps link with live coordinates.
- Uses **Web Share API** with Clipboard fallback.

### Smart Check-In
If the user fails to confirm safety before the selected timer expires, the system automatically triggers SOS.

### Demo Mode
Simulates movement through predefined risk zones for testing, demonstrations, hackathons, and presentations.

## 🤖 AI Data Extraction Pipeline (Optional)

SafeSphere includes a Python-based pipeline for generating `areas.json` from safety-related articles.

### Setup Virtual Environment
```bash
python3 -m venv venv
```

**Activate:**
- Mac/Linux: `source venv/bin/activate`
- Windows: `venv\Scripts\activate`

### Install Dependencies
```bash
pip install openai requests python-dotenv
```

### Add API Key
Create a `.env` file:
```env
OPENAI_API_KEY=your_api_key_here
```

### Run Extraction Script
```bash
python main.py
```
This process reads articles, extracts risk locations, geocodes coordinates, and generates `areas.json`.

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6)

### APIs
- Leaflet.js
- Geolocation API
- Web Speech Recognition API
- MediaRecorder API
- Web Share API

### Data Layer
- AI-generated JSON dataset
- OpenStreetMap geocoding
- Python processing pipeline

## 💻 Browser Requirements

**Recommended:** Google Chrome, Microsoft Edge
**Permissions required:** Location, Microphone

## 🔒 Security Notice
- Fully frontend-based architecture.
- No persistent backend storage.
- Evidence files stored locally on user device.

## 🗺️ Roadmap
- [ ] Backend API integration
- [ ] Real-time logging database
- [ ] Risk heatmap visualization
- [ ] Authentication system
- [ ] Cloud-based evidence storage
- [ ] SMS-based emergency alerts

## 🤝 Contributing
Contributions are welcome. Improvements to risk modeling, UI/UX, documentation, performance, and feature expansion are encouraged. 
Please refer to a `.github/CONTRIBUTING.md` file for structured contribution guidelines.

## 📄 License
Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
If deployed as a network-accessible service, the source code must remain available under the same license terms. See the LICENSE file for details.
