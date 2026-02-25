# SafeSphere — Intelligent Women Safety System

SafeSphere is a web-based safety platform designed to help people feel more secure. It uses real-time location tracking, risk modeling, and automated emergency features to provide a blanket of security when you're on the move. 

The idea is simple: combining browser capabilities with safety datasets to give you a clear picture of your surroundings, while keeping emergency tools just a tap or a voice command away.

## Overview

Here is what SafeSphere can do:
- **Real-time GPS tracking**
- **Risk mapping** to show you potentially unsafe areas
- **Smart SOS system** with a cancellation countdown lock
- **Voice-triggered emergency activation** (just say "Help" or "Emergency")
- **Audio evidence recording**
- **Live location sharing** with your contacts
- **Automated safety check-ins**
- **Simulation mode** if you just want to test it out

Everything runs directly in your browser. We also included an optional AI pipeline if you want to generate your own safety zones from news articles.

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/YOUR-USERNAME/SafeSphere.git
cd SafeSphere
```

### Running the Application

Because SafeSphere needs to load local data files (like `areas.json`), you can't just double-click the `index.html` file. Modern browsers will block it for security reasons (CORS).

Instead, you just need to spin up a quick local server. If you have Python installed, it's super easy:

**Start a Local Server:**
```bash
python3 -m http.server 8000
```

**Open in your browser:**
Head over to [http://localhost:8000/index.html](http://localhost:8000/index.html)

## Project Structure

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

> **Note**: Make sure `areas.json` stays in the same folder as `index.html`.

## How Risk Intelligence Works

SafeSphere doesn't just guess risk levels; it calculates a dynamic score based on a few factors:
- How close you are to known danger zones
- Weighted severity of past incidents
- Population density
- Lighting conditions
- The time of day

**Zones are color-coded on the map for quick reading:**
| Risk Level | Color  |
| --- | --- |
| Low | Green  |
| Medium | Yellow |
| High | Red |

## Emergency Workflow

### Smart SOS
1. You activate the SOS button.
2. A 5-second countdown starts in case it was an accident.
3. If you don't cancel it, the alarm goes off and the incident is logged.

### Voice Activation
When your hands are full or you can't reach your phone, you can just use your voice. The system listens for keywords like "Help" or "Emergency" and automatically triggers the SOS.

### Evidence Mode
- Automatically uses your microphone to capture audio evidence.
- The recording is saved straight to your local device with a timestamp.
- *Note: We deliberately don't store these recordings on any external servers yet.*

### Location Sharing
Need to tell someone where you are? The app generates a Google Maps link with your exact coordinates that you can quickly share or copy to your clipboard.

### Smart Check-In
Set a timer. If it expires and you haven't clicked the button to confirm you are safe, SafeSphere automatically triggers an SOS.

### Demo Mode
We built a simulation mode so you can test how the app reacts as it "moves" through different risk zones. It's great for presentations or just seeing how things work under the hood.

## AI Data Extraction Pipeline (Optional)

If you're interested in the data generation side, SafeSphere includes a Python pipeline that reads safety-related articles, extracts the location data, geocodes it, and generates the `areas.json` file.

### Setup Virtual Environment
```bash
python3 -m venv venv
```

**Activate it:**
- Mac/Linux: `source venv/bin/activate`
- Windows: `venv\Scripts\activate`

### Install Dependencies
```bash
pip install openai requests python-dotenv
```

### Add your API Key
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_api_key_here
```

### Run the Extraction Script
```bash
python main.py
```

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6)

### Browser APIs Used
- Leaflet.js (Mapping)
- Geolocation API
- Web Speech Recognition API
- MediaRecorder API
- Web Share API

### Data Layer
- AI-generated JSON datasets
- OpenStreetMap geocoding
- Python processing pipeline

## Browser Requirements

**Recommended:** Google Chrome or Microsoft Edge
**Permissions:** Make sure to allow Location and Microphone access when prompted, otherwise core features won't work.

## A Quick Security Note
SafeSphere is built entirely on the frontend right now. This means there is no central database storing your data, and any evidence files it creates are saved directly onto your device.

## What's Next (Roadmap)
We've got a lot planned to make SafeSphere even better. Some things we're looking to add:
- A dedicated backend API
- A real-time database for continuous logging
- Risk heatmap visualizers
- User authentication
- Cloud storage for evidence files
- SMS-based alerts
