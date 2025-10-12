# This file contains all the AI analysis logic.

import numpy as np
from PIL import Image
import io

from tensorflow.keras.applications.vgg16 import preprocess_input, decode_predictions
from model_loader import model

# --- NEW: Department Mapping Logic ---
# This dictionary connects the AI's final category to a specific government department.
CATEGORY_TO_DEPARTMENT_MAP = {
    "Fire": "emergency_response",
    "Vehicle Accident": "emergency_response",
    "Medical Emergency": "medical_health",
    "Infrastructure Damage": "infrastructure_utilities",
    "Flood": "environment_hazards",
    "General Incident": "community_support",
    "Unclassified": "community_support",
    "Error": "community_support"
}

def analyze_image(image_data):
    try:
        img = Image.open(io.BytesIO(image_data)).resize((224, 224))
        x = np.array(img)
        x = np.expand_dims(x, axis=0)
        x = preprocess_input(x)
        predictions = model.predict(x, verbose=0)
        decoded_predictions = decode_predictions(predictions, top=5)[0]
        
        print("\nModel saw these general objects:", [(p[1], round(p[2],2)) for p in decoded_predictions])
        raw_model_output = [(pred[1], float(pred[2])) for pred in decoded_predictions]

        disaster_categories_map = {
            "Fire": ["fireboat", "fire_engine", "flame", "matchstick", "volcano"],
            "Flood": ["dam", "breakwater", "river", "lifeboat"],
            "Infrastructure Damage": ["ruin", "wreck", "bridge", "palace", "seashore"],
            "Vehicle Accident": ["ambulance", "crash_helmet", "police_van", "car_crash"]
        }

        matched_categories = []
        for _, pred_name, pred_score in decoded_predictions:
            for disaster_type, keywords in disaster_categories_map.items():
                if any(k in pred_name.lower() for k in keywords) and pred_score > 0.05:
                    matched_categories.append({"type": disaster_type, "score": float(pred_score)})
        
        if not matched_categories:
            matched_categories = [{"type": "Unclassified/General", "score": 0.0}]

        return matched_categories, raw_model_output
    except Exception as e:
        print(f"Error in analyze_image: {e}")
        return [{"type": "Error", "score": 0.0}], []

def categorize_text_nlp(text):
    text = text.lower()
    if any(keyword in text for keyword in ['fire', 'smoke']): return "Fire", "Critical"
    if any(keyword in text for keyword in ['flood', 'water']): return "Flood", "High"
    if any(keyword in text for keyword in ['collapse', 'damage', 'road blocked']): return "Infrastructure Damage", "High"
    if any(keyword in text for keyword in ['injured', 'medical', 'accident']): return "Medical Emergency", "Critical"
    return "General Incident", "Medium"

def analyze_report_from_data(image_data, report_text=""):
    nlp_category, nlp_priority = categorize_text_nlp(report_text)
    image_analysis_results, raw_model_output = analyze_image(image_data)

    final_category = nlp_category
    credibility_score = 0.6 if report_text else 0.0

    if image_analysis_results and image_analysis_results[0]['type'] not in ["Unclassified/General", "Error"]:
        best_image_match = max(image_analysis_results, key=lambda x: x['score'])
        credibility_score += 0.85
        if best_image_match['score'] > 0.15:
            final_category = best_image_match['type']
            if not report_text:
                if final_category in ["Fire", "Medical Emergency"]: nlp_priority = "Critical"
                elif final_category in ["Infrastructure Damage", "Flood"]: nlp_priority = "High"

    credibility_score = min(credibility_score, 1.0)
    
    # --- NEW: Assign department based on the final category ---
    assigned_department = CATEGORY_TO_DEPARTMENT_MAP.get(final_category, "community_support")

    return {
        "incident_text": report_text or "No text provided.",
        "raw_model_output": raw_model_output,
        "final_assessment": {
            "category": final_category,
            "priority": nlp_priority,
            "credibility_score": round(credibility_score, 2),
            "assigned_department": assigned_department # <-- NEW FIELD
        }
    }

