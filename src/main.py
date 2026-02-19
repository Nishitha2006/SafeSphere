import os
import json
import requests
import time
import re
from openai import OpenAI

# 🔑 Replace with your OpenAI API key
client = OpenAI(api_key="YOUR_API_KEY")

ARTICLES_FOLDER = "articles"
CITY = "Coimbatore"
STATE = "Tamil Nadu"

all_areas = []


# -----------------------------
# 1️⃣ Extract from Article
# -----------------------------
def extract_from_article(article_text):
    prompt = f"""
You are a structured data extraction system.

City is Coimbatore for all entries.

IMPORTANT:
- Extract ONLY specific standalone locality names.
- Do NOT include combined areas (A & B).
- Do NOT include highways.
- Do NOT include phrases like "near", "between", "around".
- Split multiple areas into separate entries.
- Ignore vague descriptions.

Classification Rules:

Population Density:
- crowded / market / commercial / bus stand / mall → High
- residential → Medium
- outskirts / isolated → Low

Lighting:
- poor lighting / dark → Poor
- not mentioned → Moderate

Time Risk:
- night / late night / evening → Night
- otherwise → Day

Crime Level:
- severe assault / repeated incidents → High
- harassment / stalking → Medium
- minor complaint → Low

Scoring:
- High crime = +4
- Medium crime = +2
- High density = +3
- Poor lighting = +3
- Night incident = +2

Risk Category:
- 0–3 Green
- 4–6 Yellow
- 7–10 Red

Return ONLY valid JSON:

{{
  "areas": [
    {{
      "area_name": "",
      "crime_level": "",
      "population_density": "",
      "lighting_condition": "",
      "time_risk": "",
      "risk_score": 0,
      "risk_category": ""
    }}
  ]
}}

Article:
{article_text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0
    )

    return json.loads(response.choices[0].message.content)


# -----------------------------
# 2️⃣ Clean Area Name
# -----------------------------
def clean_area_name(name):
    # Remove parentheses content
    name = re.sub(r"\(.*?\)", "", name)

    # Remove unwanted phrases
    unwanted = [
        "near", "between", "around",
        "range", "division", "&",
        "road", "highway", "area"
    ]

    for word in unwanted:
        name = re.sub(rf"\b{word}\b", "", name, flags=re.IGNORECASE)

    return name.strip()


# -----------------------------
# 3️⃣ Geocoding Function
# -----------------------------
def get_lat_lng(area_name):
    query = f"{area_name}, {CITY}, {STATE}"

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": query,
        "format": "json",
        "limit": 1
    }

    headers = {
        "User-Agent": "SafeSphereApp"
    }

    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    if data:
        return float(data[0]["lat"]), float(data[0]["lon"])
    else:
        return None, None


# -----------------------------
# 4️⃣ Extract All Articles
# -----------------------------
for filename in os.listdir(ARTICLES_FOLDER):
    if filename.endswith(".txt"):
        path = os.path.join(ARTICLES_FOLDER, filename)

        with open(path, "r", encoding="utf-8") as f:
            article_text = f.read()

        print(f"Processing {filename}...")

        result = extract_from_article(article_text)

        if "areas" in result:
            all_areas.extend(result["areas"])


# -----------------------------
# 5️⃣ Aggregate Duplicates
# -----------------------------
aggregated = {}

for area in all_areas:
    cleaned_name = clean_area_name(area["area_name"]).lower()

    if not cleaned_name:
        continue

    if cleaned_name not in aggregated:
        area["area_name"] = cleaned_name.title()
        aggregated[cleaned_name] = area
    else:
        # Keep highest risk_score
        if area["risk_score"] > aggregated[cleaned_name]["risk_score"]:
            area["area_name"] = cleaned_name.title()
            aggregated[cleaned_name] = area


# -----------------------------
# 6️⃣ Add Coordinates
# -----------------------------
final_areas = []

for area in aggregated.values():
    print(f"Geocoding {area['area_name']}...")

    lat, lng = get_lat_lng(area["area_name"])

    if lat is None or lng is None:
        print(f"⚠ Skipping {area['area_name']} (not geocodable)")
        continue

    area["city"] = CITY
    area["latitude"] = lat
    area["longitude"] = lng

    final_areas.append(area)

    time.sleep(1)  # avoid rate limit


# -----------------------------
# 7️⃣ Save Final JSON
# -----------------------------
final_output = {
    "city": CITY,
    "state": STATE,
    "total_unique_areas": len(final_areas),
    "areas": final_areas
}

with open("areas.json", "w", encoding="utf-8") as f:
    json.dump(final_output, f, indent=4)

print("\n✅ Clean areas.json successfully created!")
