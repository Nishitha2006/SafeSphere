window.addEventListener("DOMContentLoaded", async () => {
  await loadRiskData();
});

let map;
let userMarker;
let previousRisk = 0;
let lastLat = null;
let currentLat = null;
let currentLon = null;


// ─── LOCATION ────────────────────────────────────────────
function getLocation() {
  navigator.geolocation.watchPosition(showPosition);
}

function showPosition(position) {
  let lat = position.coords.latitude;
  let lon = position.coords.longitude;
  currentLat = lat;
  currentLon = lon;

  document.getElementById("location").innerText =
    `Lat: ${lat.toFixed(4)} | Lon: ${lon.toFixed(4)}`;

  if (!map) {
    map = L.map('map').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    drawRiskZones();
}


  if (userMarker) userMarker.setLatLng([lat, lon]);
  else userMarker = L.marker([lat, lon]).addTo(map);

  updateRisk(lat, lon);

  if (lastLat && lat > lastLat) logAlert("Projected Risk Ahead");
  lastLat = lat;
}

function drawRiskZones() {
  riskZones.forEach(zone => {
    const color = zoneColors[zone.severity] || "#ff2828";

    L.circle([zone.lat, zone.lon], {
      color,
      fillColor: color,
      fillOpacity: 0.15,
      weight: 2,
      radius: 250
    })
    .bindPopup(`<b>${zone.label}</b><br>Severity: ${zone.severity}`)
    .addTo(map);
  });
}


// ─── RISK ─────────────────────────────────────────────────
function calculateRisk(lat, lon) {
  let risk = 0;
  let explanations = [];
  let hour = new Date().getHours();

  riskZones.forEach(zone => {
    let distance = map.distance([lat, lon], [zone.lat, zone.lon]);
    if (distance < 300) {
      risk += zone.weight;
      explanations.push(zone.label);
    }
  });

  if (hour >= 22 || hour < 4) {
    risk *= 1.8;
    explanations.push("Late night hours — heightened risk window");
  } else if (hour >= 20) {
    risk *= 1.5;
    explanations.push("Night-time multiplier active (after 8 PM)");
  } else if (hour >= 6 && hour < 9) {
    risk *= 0.8;
    explanations.push("Morning hours — lower activity risk");
  }

  if (hour >= 17 && hour <= 20)
    explanations.push("Peak evening hours — stay aware of surroundings");

  if (explanations.length === 0) {
    explanations.push("No active risk zones nearby");
    explanations.push("Area appears clear — stay aware");
  }

  return { risk, explanations };
}

function updateRisk(lat, lon) {
  let result = calculateRisk(lat, lon);
  let risk = result.risk;

  let mode = document.getElementById("modeSelect").value;
  let threshold = mode === "high" ? 40 : mode === "normal" ? 60 : 75;
  console.log("Risk:", risk);
  document.getElementById("score").innerText = Math.max(0, 100 - risk);

  if (risk > previousRisk) document.getElementById("trend").innerText = "⬆ Increasing";
  else if (risk < previousRisk) document.getElementById("trend").innerText = "⬇ Decreasing";
  else document.getElementById("trend").innerText = "➡ Stable";

  previousRisk = risk;

  let list = document.getElementById("explanationList");
  list.innerHTML = "";
  result.explanations.forEach(e => {
    let li = document.createElement("li");
    li.innerText = e;
    list.appendChild(li);
  });

  if (risk > threshold) logAlert("⚠ Elevated Risk Detected");
}

// ─── SOS WITH COUNTDOWN ───────────────────────────────────
let sosCountdownInterval = null;
let sosTimeLeft = 5;

function triggerSOS() {

  // If already counting down, trigger immediately
  if (sosCountdownInterval) {
    fireSOS();
    return;
  }

  sosTimeLeft = 5;
  showSOSOverlay();

  sosCountdownInterval = setInterval(() => {

    sosTimeLeft--;

    const el = document.getElementById("sosCountdownNum");
    if (el) el.textContent = Math.max(0, sosTimeLeft);

    if (sosTimeLeft <= 0) {
      clearInterval(sosCountdownInterval);
      sosCountdownInterval = null;
      fireSOS();
    }

  }, 1000);
}

function fireSOS() {
  // 1. Play the alarm audio
  const alarm = document.getElementById("alarm");
  alarm.play().catch(err => console.log("Audio error:", err));
  
  // 2. Show the "Stop Alarm" button and hide the countdown
  document.getElementById("stopAlarmBtn").style.display = "inline-flex"; 
  hideSOSOverlay();
  
  // 3. Trigger the WhatsApp message
  sendWhatsAppSOS();
}

function sendWhatsAppSOS() {
  const user = JSON.parse(localStorage.getItem("safesphere_user"));

  // Fixed the 0{currentLat} typo and used standard maps format
  const mapsLink = `https://maps.google.com/?q=${currentLat},${currentLon}`;

  const message = `🚨 SOS ALERT!\nI may be in danger.\n\nLocation:\n${mapsLink}`;
  const url = `https://wa.me/${user.phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}


function cancelSOS() {
  clearInterval(sosCountdownInterval);
  sosCountdownInterval = null;
  hideSOSOverlay();
  stopAlarm();
  logAlert("SOS cancelled by user.");
}

function stopAlarm() {
  const alarm = document.getElementById("alarm");
  alarm.pause();
  alarm.currentTime = 0;
  alarm.loop = false;
  document.getElementById("stopAlarmBtn").style.display = "none";
}

function showSOSOverlay() {
  document.getElementById("sosOverlay").style.display = "flex";
  const el = document.getElementById("sosCountdownNum");
  if (el) el.textContent = sosTimeLeft;
}

function hideSOSOverlay() {
  document.getElementById("sosOverlay").style.display = "none";
}

// ─── SHARE LOCATION ───────────────────────────────────────
function shareLocation() {
  if (!currentLat || !currentLon) {
    logAlert("⚠ No location yet — start tracking first");
    showShareToast("Start tracking first!", false);
    return;
  }

  const mapsLink = `https://maps.google.com/?q=${currentLat.toFixed(6)},${currentLon.toFixed(6)}`;
  const msg = `📍 My current location (SafeSphere):\n${mapsLink}`;

  if (navigator.share) {
    navigator.share({ title: "My SafeSphere Location", text: msg, url: mapsLink });
  } else {
    navigator.clipboard.writeText(msg).then(() => {
      showShareToast("Location link copied to clipboard!", true);
      logAlert("📍 Location shared to clipboard");
    }).catch(() => {
      // Fallback: show the link in a prompt
      prompt("Copy this link and send it to your contact:", mapsLink);
    });
  }
}

function showShareToast(msg, success) {
  let toast = document.getElementById("shareToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "shareToast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = "share-toast " + (success ? "success" : "error");
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// ─── DEMO MODE ────────────────────────────────────────────
let demoActive = false;
let demoInterval = null;
let demoIndex = 0;

function toggleDemo() {
  demoActive = !demoActive;
  const btn = document.getElementById("demoBtn");

  if (demoActive) {

    btn.innerHTML = "⏹ Stop Demo";
    logAlert("🎬 Demo mode activated");

    // Include HIGH + MEDIUM zones
    const demoZones = riskZones
      .filter(z => z.severity === "high" || z.severity === "medium")
      .sort((a, b) => {
        if (a.severity === b.severity) return 0;
        if (a.severity === "high") return -1;
        return 1;
      });

    if (demoZones.length === 0) {
      logAlert("⚠ No risk zones found");
      return;
    }

    demoIndex = 0;

    demoInterval = setInterval(() => {

      const zone = demoZones[demoIndex];
      const lat = zone.lat;
      const lon = zone.lon;

      updateRisk(lat, lon);

      if (map) {
        map.setView([lat, lon], 14);
      }

      if (zone.severity === "high") {
        logAlert("🚨 Entering HIGH risk zone: " + zone.label);
      } else {
        logAlert("⚠ Entering MEDIUM risk zone: " + zone.label);
      }

      demoIndex++;
      if (demoIndex >= demoZones.length) {
        demoIndex = 0;
      }

    }, 4000);

  } else {

    btn.innerHTML = "🎬 Demo Mode";
    logAlert("🛑 Demo mode stopped");
    clearInterval(demoInterval);
  }
}

function startDemo() {
  if (!map) {
    map = L.map('map').setView([demoPath[0].lat, demoPath[0].lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    drawRiskZones();
  }

  demoStep = 0;
  logAlert("🎬 Demo mode started");
  document.getElementById("demoBtn").textContent = "⏹ Stop Demo";
  document.getElementById("demoBtn").classList.add("active");

  const runStep = () => {
    if (demoStep >= demoPath.length) {
      stopDemo();
      return;
    }

    const point = demoPath[demoStep];
    currentLat = point.lat;
    currentLon = point.lon;

    // Update coord display
    const latEl = document.getElementById("lat-display");
    const lonEl = document.getElementById("lon-display");
    if (latEl) latEl.textContent = point.lat.toFixed(5);
    if (lonEl) lonEl.textContent = point.lon.toFixed(5);

    // Move marker
    if (demoMarker) demoMarker.setLatLng([point.lat, point.lon]);
    else {
      demoMarker = L.marker([point.lat, point.lon]).addTo(map);
    }
    map.panTo([point.lat, point.lon]);

    updateRisk(point.lat, point.lon);
    demoStep++;
  };

  runStep();
  demoInterval = setInterval(runStep, 1800);
}

function stopDemo() {
  clearInterval(demoInterval);
  demoInterval = null;
  if (demoMarker) { demoMarker.remove(); demoMarker = null; }
  document.getElementById("demoBtn").textContent = "🎬 Demo Mode";
  document.getElementById("demoBtn").classList.remove("active");
  logAlert("🎬 Demo mode ended");
}

// ─── MISC ─────────────────────────────────────────────────
function logAlert(msg) {
  const log = document.getElementById("alertLog");
  const entry = document.createElement("div");
  entry.innerText = `${msg} - ${new Date().toLocaleTimeString()}`;
  log.appendChild(entry);
}

function startListening() {

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice recognition not supported in this browser");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    logAlert("🎤 Listening for 'help' or 'emergency'");
  };

  recognition.onresult = function(event) {

    const speech = event.results[0][0].transcript.toLowerCase();
    console.log("Voice detected:", speech);

    if (speech.includes("help") || speech.includes("emergency")) {
      logAlert("Voice SOS detected");
      triggerSOS();
    }
  };

  recognition.onerror = (e) => {
    console.log("Speech error:", e);
  };

  recognition.start();
}

let callActive = false;

function fakeCall() {
  const screen = document.getElementById('callScreen');
  const ringtone = document.getElementById('ringtone');
  const subtitle = document.getElementById('callSubtitle');
  const acceptBtn = document.getElementById('acceptBtn');

  screen.style.display = 'flex';
  subtitle.textContent = "Incoming Call…";
  acceptBtn.textContent = "✓ Accept";

  ringtone.currentTime = 0;
  ringtone.play().catch(err => console.log(err));

  callActive = false;
}

function acceptFakeCall() {
  const ringtone = document.getElementById('ringtone');
  const subtitle = document.getElementById('callSubtitle');
  const acceptBtn = document.getElementById('acceptBtn');

  ringtone.pause();
  ringtone.currentTime = 0;

  subtitle.textContent = "Call in Progress...";
  acceptBtn.textContent = "End Call";

  // Change button action
  acceptBtn.onclick = endFakeCall;

  callActive = true;
}

function declineFakeCall() {
  endFakeCall();
}

function endFakeCall() {
  const ringtone = document.getElementById('ringtone');
  const screen = document.getElementById('callScreen');
  const subtitle = document.getElementById('callSubtitle');
  const acceptBtn = document.getElementById('acceptBtn');

  ringtone.pause();
  ringtone.currentTime = 0;

  screen.style.display = 'none';
  subtitle.textContent = "Incoming Call…";
  acceptBtn.textContent = "✓ Accept";

  // Restore original action
  acceptBtn.onclick = acceptFakeCall;

  callActive = false;
}


let checkInInterval;
let checkInTimeLeft = 0;

function startCheckIn() {
  const selectedDuration = parseInt(document.getElementById("checkInDuration").value);
  checkInTimeLeft = selectedDuration;
  document.getElementById("checkInPanel").style.display = "block";
  updateCheckInDisplay();

  checkInInterval = setInterval(() => {
    checkInTimeLeft--;
    updateCheckInDisplay();
    if (checkInTimeLeft <= 0) {
      clearInterval(checkInInterval);
      document.getElementById("checkInPanel").style.display = "none";
      logAlert("No response detected. Auto SOS triggered.");
      triggerSOS();
    }
  }, 1000);
}

function updateCheckInDisplay() {
  let minutes = Math.floor(checkInTimeLeft / 60);
  let seconds = checkInTimeLeft % 60;
  document.getElementById("checkInTimer").innerText =
    `Respond in ${minutes}:${seconds.toString().padStart(2,'0')}`;
}

function confirmSafe() {
  clearInterval(checkInInterval);
  document.getElementById("checkInPanel").style.display = "none";
  logAlert("User confirmed safe.");
}

function startEvidenceMode() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      let recorder = new MediaRecorder(stream);
      recorder.start();
      logAlert("Evidence recording started");
      setTimeout(() => { recorder.stop(); logAlert("Evidence secured"); }, 5000);
    });
}

// ─── USER SAFETY FEEDBACK ─────────────────────────

function updateZoneRisk(lat, lon, newWeight) {

  let nearest = null;
  let minDist = Infinity;

  riskZones.forEach(zone => {

    const dist = map.distance([lat, lon], [zone.lat, zone.lon]);

    if (dist < minDist) {
      minDist = dist;
      nearest = zone;
    }

  });

  if (nearest && minDist < 300) {

    // update existing zone
    nearest.weight = newWeight;

    logAlert("AI updated nearby zone weight to " + newWeight);

  } else {

    // determine severity from weight
    let severity = "low";

    if (newWeight >= 60) severity = "high";
    else if (newWeight >= 40) severity = "medium";

    // create new dynamic zone
    const newZone = {
      lat: lat,
      lon: lon,
      weight: newWeight,
      label: "User Safety Report",
      severity: severity
    };

    riskZones.push(newZone);

    drawRiskZones();

    logAlert("New AI risk zone created");

  }

  // force recalculation
  updateRisk(currentLat, currentLon);
}


function openFeedbackForm() {
  document.getElementById("feedbackOverlay").style.display = "flex";
}

function closeFeedbackForm() {
  document.getElementById("feedbackOverlay").style.display = "none";
}


async function submitSafetyFeedback() {

  if (!currentLat || !currentLon) {
    logAlert("Start tracking before submitting feedback");
    return;
  }

  const text = document.getElementById("feedbackText").value;
  const imageFile = document.getElementById("feedbackImage").files[0];

  const formData = new FormData();
  formData.append("description", text);
  formData.append("lat", currentLat);
  formData.append("lon", currentLon);

  if (imageFile) formData.append("image", imageFile);

  // Loading state
  const btn = document.getElementById("submitFeedbackBtn");
  const btnContent = document.getElementById("submitBtnContent");

  btn.disabled = true;
  btnContent.innerHTML = '<span class="submit-spinner"></span> Analyzing...';

  logAlert("Submitting report to AI agent...");

  try {

    const res = await fetch("http://127.0.0.1:8000/agent-review", {
      method: "POST",
      body: formData
    });

    const result = await res.json();

    console.log("Agent result:", result);

    updateZoneRisk(currentLat, currentLon, result.updatedWeight);

    logAlert("AI updated risk score");

  } catch (e) {

    console.error(e);
    logAlert("Error contacting AI agent");

  }

  // Reset button
  btn.disabled = false;
  btnContent.innerHTML = '⚑ Submit Report';

  closeFeedbackForm();
}