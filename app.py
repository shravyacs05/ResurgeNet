import os
import pickle
import numpy as np
import uvicorn
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

# --- 1. Initialize the FastAPI app ---
app = FastAPI(title="Natural Disaster Prediction API")

# --- 2. Load ONLY the Forest Fire Model ---
print("Loading Forest Fire model... 🧠")
try:
    with open('model.pkl', 'rb') as f:
        forest_fire_model = pickle.load(f)
    print("Forest Fire model loaded successfully! ✅")
except FileNotFoundError:
    print("❌ FATAL ERROR: 'model.pkl' for forest fire not found. Please run forest_fire.py first.")
    exit()

# --- 3. Template and Static File Configuration ---
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- 4. API Routes ---
@app.get("/", response_class=HTMLResponse)
async def get_forest_fire_page(request: Request):
    """Serves the forest fire prediction page."""
    return templates.TemplateResponse("forest_fire.html", {"request": request})

@app.post("/predict", response_class=HTMLResponse)
async def predict_forest_fire(request: Request, temperature: float = Form(...), oxygen: float = Form(...), humidity: float = Form(...)):
    """Receives forest fire data, makes a prediction, and returns the result."""
    final_features = [np.array([oxygen, temperature, humidity])]
    prediction_proba = forest_fire_model.predict_proba(final_features)
    output_prob = prediction_proba[0][1]

    if output_prob > 0.5:
        pred_text = f'Your Forest is in Danger. Probability of fire is {output_prob:.2%}'
        bhai_text = "Action is required to mitigate the risk."
    else:
        pred_text = f'Your Forest is safe. Probability of fire is {output_prob:.2%}'
        bhai_text = "Your Forest is Safe for now."

    return templates.TemplateResponse("forest_fire.html", {"request": request, "pred": pred_text, "bhai": bhai_text})

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)