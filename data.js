let riskZones = [];
const zoneColors = { high: "#ff2828", medium: "#ff9500", low: "#ffdd00" };

async function loadRiskData() {
  const response = await fetch('./areas.json');
  const data = await response.json();

  riskZones = data.areas.map(area => {
    let severity = "low";
    let weight = 20;

    if (area.risk_category.toLowerCase() === "red") {
      severity = "high";
      weight = 60;
    } else if (area.risk_category.toLowerCase() === "yellow") {
      severity = "medium";
      weight = 40;
    }

    return {
      lat: parseFloat(area.latitude),
      lon: parseFloat(area.longitude),
      weight: weight,
      label: area.area_name + " — " + area.crime_level,
      severity: severity
    };
  });

  console.log("✅ Real risk data loaded:", riskZones);
}
