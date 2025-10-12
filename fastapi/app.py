from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
from typing import List, Dict, Optional, Any
import uvicorn
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(title="Disaster Response API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Full department mapping
DEPARTMENT_MAP = {
    "related": "N/A",
    "request": "Disaster Management / Relief Coordination",
    "offer": "N/A",
    "aid_related": "Disaster Relief & Humanitarian Aid",
    "medical_help": "Health / Medical Services",
    "medical_products": "Health / Medical Supplies",
    "search_and_rescue": "Search & Rescue / Fire & Emergency Services",
    "security": "Police / Security Department",
    "military": "Defense / Military Coordination",
    "water": "Water Management Department",
    "food": "Food & Relief Distribution",
    "shelter": "Social Welfare / Shelter Department",
    "clothing": "Social Welfare / Relief Distribution",
    "money": "Social Welfare / Relief Distribution",
    "missing_people": "Police / Missing Persons Unit",
    "refugees": "Social Welfare / Refugee Assistance",
    "death": "Health / Civil Registrar",
    "other_aid": "Disaster Relief Coordination",
    "infrastructure_related": "Public Works / Infrastructure Dept.",
    "transport": "Transport / Traffic Department",
    "buildings": "Building / Housing Authority",
    "electricity": "Electricity Board / Utilities Dept.",
    "tools": "Disaster Relief / Municipal Logistics",
    "hospitals": "Health Department / Hospitals",
    "shops": "Trade / Commerce Dept.",
    "aid_centers": "Disaster Relief / Aid Centers",
    "other_infrastructure": "Public Works / Infrastructure Dept.",
    "weather_related": "Meteorological Department",
    "floods": "Flood Relief / Water Management / Disaster Management",
    "storm": "Meteorological Department / Disaster Management",
    "fire": "Fire Department",
    "earthquake": "Disaster Management / Earthquake Authority",
    "cold": "Social Welfare / Cold Shelter Programs",
    "other_weather": "Meteorological Department",
    "direct_report": "N/A"
}

# Simplified 5-department mapping
SIMPLIFIED_DEPARTMENT_MAP = {
    # Emergency Response Department
    "related": "emergency_response",
    "request": "emergency_response", 
    "search_and_rescue": "emergency_response",
    "fire": "emergency_response",
    "earthquake": "emergency_response",
    "direct_report": "emergency_response",
    "storm": "emergency_response",
    "floods": "emergency_response",
    
    # Medical & Health Department
    "medical_help": "medical_health",
    "medical_products": "medical_health",
    "hospitals": "medical_health",
    "death": "medical_health",
    
    # Infrastructure Department
    "infrastructure_related": "infrastructure",
    "transport": "infrastructure",
    "buildings": "infrastructure",
    "electricity": "infrastructure",
    "water": "infrastructure",
    "other_infrastructure": "infrastructure",
    "tools": "infrastructure",
    
    # Relief & Shelter Department
    "shelter": "relief_shelter",
    "food": "relief_shelter",
    "clothing": "relief_shelter",
    "refugees": "relief_shelter",
    "aid_centers": "relief_shelter",
    "aid_related": "relief_shelter",
    "money": "relief_shelter",
    
    # Community Safety Department
    "security": "community_safety",
    "missing_people": "community_safety",
    "military": "community_safety",
    "other_aid": "community_safety",
    "offer": "community_safety",
    "weather_related": "community_safety",
    "cold": "community_safety",
    "other_weather": "community_safety",
    "shops": "community_safety"
}

# Department priorities for routing
DEPARTMENT_PRIORITY = {
    "emergency_response": 1,
    "medical_health": 2,
    "community_safety": 3,
    "infrastructure": 4,
    "relief_shelter": 5
}

# Load the trained model and category names
try:
    with open("disaster_model.pkl", "rb") as f:
        model = pickle.load(f)
    with open("category_names.pkl", "rb") as f:
        category_names = pickle.load(f)
    print("✅ Model and categories loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    category_names = None

# Pydantic models
class MessageRequest(BaseModel):
    message: str

class PredictionResponse(BaseModel):
    message: str
    predictions: Dict[str, int]
    departments: Dict[str, str]

class SOSPredictionResponse(BaseModel):
    message: str
    predictions: Dict[str, int]
    primary_departments: List[str]
    department_details: Dict[str, List[str]]
    department_priorities: Dict[str, int]
    active_categories: List[Dict[str, str]]
    confidence_score: float
    urgency_level: str

class BatchMessageRequest(BaseModel):
    messages: List[str]

class InteractivePredictionResponse(BaseModel):
    message: str
    predicted_categories: Dict[str, str]
    departments_to_handle: Dict[str, str]
    summary: Dict[str, Any]

# Helper functions
def get_simplified_departments(predictions):
    """Map predictions to simplified 5-department structure with priorities"""
    departments = {}
    department_scores = {
        'emergency_response': 0,
        'medical_health': 0,
        'infrastructure': 0,
        'relief_shelter': 0,
        'community_safety': 0
    }
    
    for category, value in predictions.items():
        if value == 1:
            dept = SIMPLIFIED_DEPARTMENT_MAP.get(category, 'emergency_response')
            if dept not in departments:
                departments[dept] = []
            departments[dept].append(category)
            department_scores[dept] += 1
    
    # Sort departments by score and priority
    sorted_departments = sorted(
        [(dept, score) for dept, score in department_scores.items() if score > 0],
        key=lambda x: (-x[1], DEPARTMENT_PRIORITY.get(x[0], 999))
    )
    
    return {
        'primary_departments': [dept for dept, _ in sorted_departments],
        'department_details': departments,
        'department_scores': department_scores
    }

def calculate_urgency(predictions, severity=None):
    """Calculate urgency level based on predictions and severity"""
    urgent_categories = ['fire', 'earthquake', 'medical_help', 'search_and_rescue', 
                        'floods', 'trapped', 'structural_collapse']
    
    urgent_count = sum(1 for cat in urgent_categories if predictions.get(cat, 0) == 1)
    total_active = sum(predictions.values())
    
    if severity == 'high' or urgent_count >= 2:
        return 'critical'
    elif urgent_count >= 1 or total_active >= 3:
        return 'high'
    elif total_active >= 2:
        return 'medium'
    else:
        return 'low'

# API Endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "categories_loaded": category_names is not None,
        "timestamp": datetime.now().isoformat()
    }

# Standard prediction endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict_message(request: MessageRequest):
    if not model or not category_names:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        prediction = model.predict([request.message])[0]
        predictions = {cat: int(pred) for cat, pred in zip(category_names, prediction)}
        
        departments = {}
        for cat, val in predictions.items():
            if val == 1:
                dept = SIMPLIFIED_DEPARTMENT_MAP.get(cat, 'emergency_response')
                if dept not in departments:
                    departments[dept] = DEPARTMENT_MAP.get(cat, "Unknown")
        
        return {
            "message": request.message,
            "predictions": predictions,
            "departments": departments
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SOS-specific prediction endpoint
@app.post("/predict_sos", response_model=SOSPredictionResponse)
async def predict_sos_alert(request: MessageRequest):
    if not model or not category_names:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Make prediction
        prediction = model.predict([request.message])[0]
        predictions = {cat: int(pred) for cat, pred in zip(category_names, prediction)}
        
        # Get department assignments
        dept_info = get_simplified_departments(predictions)
        
        # Calculate confidence score (based on number of categories detected)
        active_categories = sum(predictions.values())
        confidence_score = min(active_categories * 0.15 + 0.4, 1.0)
        
        # Get urgency level
        urgency = calculate_urgency(predictions)
        
        # Get active categories with department mapping
        active_cats = []
        for cat, val in predictions.items():
            if val == 1:
                dept = SIMPLIFIED_DEPARTMENT_MAP.get(cat, 'emergency_response')
                active_cats.append({
                    'category': cat,
                    'category_display': cat.replace('_', ' ').title(),
                    'department': dept,
                    'department_name': DEPARTMENT_MAP.get(cat, "Unknown")
                })
        
        # Sort active categories by department priority
        active_cats.sort(key=lambda x: DEPARTMENT_PRIORITY.get(x['department'], 999))
        
        return {
            "message": request.message,
            "predictions": predictions,
            "primary_departments": dept_info['primary_departments'],
            "department_details": dept_info['department_details'],
            "department_priorities": dept_info['department_scores'],
            "active_categories": active_cats,
            "confidence_score": confidence_score,
            "urgency_level": urgency
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Batch prediction
@app.post("/predict_batch")
async def predict_batch(request: BatchMessageRequest):
    if not model or not category_names:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        predictions = model.predict(request.messages)
        
        results = []
        for i, message in enumerate(request.messages):
            pred_dict = {cat: int(pred) for cat, pred in zip(category_names, predictions[i])}
            dept_info = get_simplified_departments(pred_dict)
            
            results.append({
                "message": message,
                "predictions": pred_dict,
                "departments": dept_info['primary_departments'],
                "urgency_level": calculate_urgency(pred_dict)
            })
        
        return {"results": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get categories
@app.get("/categories")
async def get_categories():
    if not category_names:
        raise HTTPException(status_code=503, detail="Categories not loaded")
    
    return {"categories": list(category_names)}

# Get department mapping
@app.get("/department_mapping")
async def get_department_mapping():
    return {
        "simplified_mapping": SIMPLIFIED_DEPARTMENT_MAP,
        "full_mapping": DEPARTMENT_MAP,
        "department_info": {
            "emergency_response": {
                "name": "Emergency Response",
                "description": "Handles immediate disaster response, search & rescue, fire, earthquakes",
                "categories": [k for k, v in SIMPLIFIED_DEPARTMENT_MAP.items() if v == "emergency_response"]
            },
            "medical_health": {
                "name": "Medical & Health",
                "description": "Manages medical emergencies, hospitals, and health supplies",
                "categories": [k for k, v in SIMPLIFIED_DEPARTMENT_MAP.items() if v == "medical_health"]
            },
            "infrastructure": {
                "name": "Infrastructure",
                "description": "Handles roads, utilities, buildings, and transportation",
                "categories": [k for k, v in SIMPLIFIED_DEPARTMENT_MAP.items() if v == "infrastructure"]
            },
            "relief_shelter": {
                "name": "Relief & Shelter",
                "description": "Manages shelters, food distribution, and refugee assistance",
                "categories": [k for k, v in SIMPLIFIED_DEPARTMENT_MAP.items() if v == "relief_shelter"]
            },
            "community_safety": {
                "name": "Community Safety",
                "description": "Handles security, missing persons, and community coordination",
                "categories": [k for k, v in SIMPLIFIED_DEPARTMENT_MAP.items() if v == "community_safety"]
            }
        }
    }

# Interactive prediction (similar to notebook)
@app.post("/predict_interactive", response_model=InteractivePredictionResponse)
async def predict_interactive(request: MessageRequest):
    if not model or not category_names:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        pred = model.predict([request.message])[0]
        
        # Convert to Yes/No
        results = {cat: "Yes" if label == 1 else "No" 
                  for cat, label in zip(category_names, pred)}
        
        # Get only active departments
        active_departments = {}
        for cat, val in results.items():
            if val == "Yes":
                dept = SIMPLIFIED_DEPARTMENT_MAP.get(cat, 'emergency_response')
                dept_name = DEPARTMENT_MAP.get(cat, "Unknown")
                active_departments[cat] = f"{dept} - {dept_name}"
        
        # Get unique departments
        unique_departments = set()
        for cat, val in results.items():
            if val == "Yes":
                dept = SIMPLIFIED_DEPARTMENT_MAP.get(cat, 'emergency_response')
                unique_departments.add(dept)
        
        return {
            "message": request.message,
            "predicted_categories": results,
            "departments_to_handle": active_departments,
            "summary": {
                "total_categories": len(results),
                "active_categories": len(active_departments),
                "departments_involved": list(unique_departments),
                "urgency_level": calculate_urgency({k: 1 if v == "Yes" else 0 for k, v in results.items()})
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)