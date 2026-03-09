from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from twilio.rest import Client

load_dotenv()

app = FastAPI()

import uuid
import shutil


from agent import graph



# Import your routing framework's request handler (e.g., from fastapi import Request)

# Add this route to your existing app
@app.post("/api/sos") 
async def send_sos(request: Request):
    data = await request.json()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    phone = data.get("phone")
    if not phone.startswith('+'):
        phone = '+' + phone
    # Format the message
    maps_link = f"https://maps.google.com/?q={latitude},{longitude}"
    message_body = f"🚨 SOS ALERT!\nI may be in danger.\n\nLocation:\n{maps_link}"

    try:
        # Execute Twilio API call
        client = Client(os.environ.get('TWILIO_ACCOUNT_SID'), os.environ.get('TWILIO_AUTH_TOKEN'))
        message = client.messages.create(
            body=message_body,
            from_=os.environ.get('TWILIO_VIRTUAL_NUMBER'),
            to=phone
        )
        return {"success": True, "sid": message.sid}
    except Exception as e:
        return {"success": False, "error": str(e)}


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def log(label, value="", color="cyan"):
    colors = {
        "cyan":    "\033[96m",
        "green":   "\033[92m",
        "yellow":  "\033[93m",
        "red":     "\033[91m",
        "white":   "\033[97m",
        "magenta": "\033[95m",
        "dim":     "\033[2m",
    }
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    c = colors.get(color, "\033[97m")
    print(f"{c}{BOLD}  {label:<22}{RESET}  {value}")

def print_divider(char="─", color="dim"):
    colors = {"dim": "\033[2m", "red": "\033[91m", "cyan": "\033[96m"}
    RESET = "\033[0m"
    c = colors.get(color, "\033[2m")
    print(f"{c}{char * 52}{RESET}")

def print_agent_result(result):
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    RED    = "\033[91m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    CYAN   = "\033[96m"
    DIM    = "\033[2m"

    print()
    print(f"{RED}{BOLD}{'━' * 52}{RESET}")
    print(f"{RED}{BOLD}  ⚠  SAFESPHERE  ·  AGENT REPORT{RESET}")
    print(f"{RED}{BOLD}{'━' * 52}{RESET}")

    print()
    print(f"{DIM}  SUBMISSION{RESET}")
    print_divider()
    log("Description:",   result.get('description', '—'),  "white")
    log("Coordinates:",   f"{result.get('lat','?')}, {result.get('lon','?')}", "cyan")
    log("Image:",         result.get('image_path') or "None provided", "cyan")

    print()
    print(f"{DIM}  VISION ANALYSIS{RESET}")
    print_divider()
    log("Vision Score:",  str(result.get('vision_score', 0)), "yellow")
    log("Reasoning:",     result.get('vision_reasoning', '—'), "white")

    print()
    print(f"{DIM}  TEXT ANALYSIS{RESET}")
    print_divider()
    risk = result.get('risk_weight', 0)
    risk_color = "green" if risk < 30 else "yellow" if risk < 55 else "red"
    log("Risk Weight:",   str(risk), risk_color)

    # Print multi-line reasoning cleanly
    raw_reasoning = result.get('reasoning', '')
    lines = [l.strip() for l in raw_reasoning.strip().splitlines() if l.strip()]
    for i, line in enumerate(lines):
        prefix = "Reasoning:" if i == 0 else " " * 10
        log(prefix, line, "white")

    print()
    print(f"{DIM}  CREDIBILITY{RESET}")
    print_divider()
    cred = result.get('credibility', 0)
    cred_color = "green" if cred >= 80 else "yellow" if cred >= 50 else "red"
    log("Score:",         f"{cred}/100", cred_color)
    log("Verdict:",       result.get('credibility_reason', '—'), "white")

    print()
    print(f"{GREEN}{BOLD}{'━' * 52}{RESET}")
    print(f"{GREEN}{BOLD}  ✓  FINAL WEIGHT → {risk}{RESET}")
    print(f"{GREEN}{BOLD}{'━' * 52}{RESET}")
    print()

@app.post("/agent-review")
async def agent_review(
    description: str = Form(...),
    lat: float = Form(...),
    lon: float = Form(...),
    image: UploadFile = File(None)
):
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM  = "\033[2m"
    RESET = "\033[0m"

    print()
    print(f"{CYAN}{BOLD}  ▶  Incoming report   lat={lat}  lon={lon}{RESET}")

    image_path = None
    if image:
        filename = f"uploads/{uuid.uuid4()}_{image.filename}"
        with open(filename, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_path = filename
        print(f"{DIM}  Image saved → {image_path}{RESET}")

    result = graph.invoke({
        "description": description,
        "lat": lat,
        "lon": lon,
        "image_path": image_path,
        "risk_weight": 20,
        "reasoning": ""
    })

    print_agent_result(result)

    return {
        "updatedWeight": int(result["risk_weight"]),
        "reason": result["reasoning"]
    }