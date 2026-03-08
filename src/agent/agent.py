from langgraph.graph import StateGraph
from langchain_openai import ChatOpenAI
from typing import TypedDict
import json
import base64
import requests
import re

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key="YOUR-API-KEY"
)

class SafetyState(TypedDict):
    description: str
    lat: float
    lon: float
    image_path: str

    vision_score: int
    vision_reasoning: str

    risk_weight: int
    reasoning: str

    credibility: int
    credibility_reason: str

def analyze_image(state: SafetyState):

    if not state.get("image_path"):
        state["vision_score"] = 0
        state["vision_reasoning"] = "No image provided"
        return state
    with open(state["image_path"], "rb") as f:
        image_bytes = f.read()

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    response = llm.invoke([
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"""
A citizen reported a safety issue.

Description:
{state['description']}

Analyze the image and determine if it shows safety risks such as:
- broken street lights
- dark roads
- suspicious activity
- unsafe infrastructure
- abandoned areas

If the image is unrelated to safety (selfies, random objects, indoor scenes, pets, food etc),
return vision_score = 0.

Return ONLY valid JSON.

Example format:

{{
 "vision_score": 30,
 "vision_reasoning": "Road appears poorly lit"
}}
"""},

                {
                    "type": "image_url",
                   "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }
    ])

    try:
        raw = response.content
        json_text = re.search(r'\{[\s\S]*?\}', raw).group()
        data = json.loads(json_text)
    except:
        data = {}

    state["vision_score"] = data.get("vision_score", 10)
    state["vision_reasoning"] = data.get("vision_reasoning", "Image unclear")

    return state

def analyze_report(state: SafetyState):

    prompt = f"""
A citizen submitted a safety report.

Description:
{state['description']}

If the description is irrelevant (jokes, random text, greetings, unrelated complaints),
return risk_weight = 0.

Return ONLY valid JSON.
Example format:

{{
 "risk_weight": number between 20 and 40,
 "reasoning": "short explanation"
}}
"""

    response = llm.invoke(prompt)

    try:
        raw = response.content
        json_text = re.search(r'\{.*\}', raw, re.S).group()
        data = json.loads(json_text)
    except:
        data = {
            "risk_weight": 25,
            "reasoning": "Default text score"
        }

    state["risk_weight"] = data["risk_weight"]
    state["reasoning"] = data["reasoning"]

    return state

def combine_scores(state: SafetyState):

    # Completely irrelevant report
    if state["vision_score"] == 0 and state["risk_weight"] == 0:
        state["credibility"] = 10
        state["credibility_reason"] = "Report unrelated to safety"
        state["risk_weight"] = 0
        state["reasoning"] = "Both image and text appear unrelated to safety issues"
        return state

    total = state["risk_weight"] + state["vision_score"]

    # Credibility adjustment
    credibility = 100
    credibility_reason = "Text and image appear consistent"

    # If no image provided
    if not state.get("image_path"):
        credibility = 50
        credibility_reason = "No image provided to verify report"
        total -= 5

    # If text claims risk but vision sees nothing
    elif state["vision_score"] == 0 and state["risk_weight"] >= 20:
        credibility = 40
        credibility_reason = "Image does not support reported safety issue"
        total -= 10

    # If image weakly supports report
    elif state["vision_score"] < 10:
        credibility = 60
        credibility_reason = "Image provides weak evidence for report"
        total -= 5

    if total > 80:
        total = 80

    if total < 0:
        total = 0

    state["risk_weight"] = total
    state["credibility"] = credibility
    state["credibility_reason"] = credibility_reason

    state["reasoning"] = f"""
Text analysis: {state['reasoning']}
Vision analysis: {state['vision_reasoning']}
Credibility: {credibility_reason}
"""

    return state

builder = StateGraph(SafetyState)

builder.add_node("vision", analyze_image)
builder.add_node("text", analyze_report)
builder.add_node("combine", combine_scores)

builder.set_entry_point("vision")

builder.add_edge("vision", "text")
builder.add_edge("text", "combine")

graph = builder.compile()