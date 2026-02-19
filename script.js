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
  // If already counting down, fire immediately
  if (sosCountdownInterval) {
    fireSOS();
    return;
  }

  sosTimeLeft = 5;
  showSOSOverlay();

  sosCountdownInterval = setInterval(() => {
    sosTimeLeft--;
    const el = document.getElementById("sosCountdownNum");
    if (el) el.textContent = sosTimeLeft;

    if (sosTimeLeft <= 0) fireSOS();
  }, 1000);
}

function fireSOS() {
  clearInterval(sosCountdownInterval);
  sosCountdownInterval = null;
  hideSOSOverlay();
  const alarm = document.getElementById("alarm");
  alarm.loop = true;
  alarm.currentTime = 0;
  alarm.play();
  logAlert("🚨 SOS Triggered!");
  // Show stop-alarm button
  document.getElementById("stopAlarmBtn").style.display = "inline-flex";
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
let demoInterval = null;
let demoStep = 0;

// Walk from safe area into a risk zone and back out
const demoPath = [
  { lat: 10.9030, lon: 76.8930 },  // safe start
  { lat: 10.9040, lon: 76.8940 },
  { lat: 10.9050, lon: 76.8952 },  // entering low zone
  { lat: 10.9055, lon: 76.8960 },
  { lat: 10.9060, lon: 76.8966 },  // inside medium zone
  { lat: 10.9065, lon: 76.8970 },
  { lat: 10.9072, lon: 76.8977 },  // inside HIGH zone — score drops hard
  { lat: 10.9068, lon: 76.8972 },
  { lat: 10.9055, lon: 76.8958 },  // walking out
  { lat: 10.9040, lon: 76.8942 },
  { lat: 10.9030, lon: 76.8930 },  // safe again
];

let demoMarker = null;

function toggleDemo() {
  if (demoInterval) {
    stopDemo();
  } else {
    startDemo();
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
  const recognition = new(window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = function(event) {
    let speech = event.results[0][0].transcript.toLowerCase();
    if (speech.includes("help") || speech.includes("emergency")) triggerSOS();
  };
}

function fakeCall() {
  const screen = document.getElementById('callScreen');
  if (screen) screen.style.display = 'flex';
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
