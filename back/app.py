# This is the main FastAPI application file.
# It defines the API endpoints and handles incoming requests.

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from analyzer import analyze_report_from_data
import base64 # Needed to send image data to the admin frontend

app = FastAPI()

# --- In-Memory Database (for demo purposes) ---
# A simple list to store the reports as they come in.
# In a real app, this would be a proper database like PostgreSQL or MongoDB.
reports_db = []

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_report_endpoint(image: UploadFile = File(...), text: str = Form("")):
    try:
        image_data = await image.read()
        analysis_result = analyze_report_from_data(image_data, text)

        # --- Storing the Report ---
        # Convert image to Base64 to easily send it as JSON to the admin dashboard
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Create a new report object
        new_report = {
            "id": len(reports_db) + 1,
            "image_b64": image_base64,
            "analysis": analysis_result
        }
        
        # Add the new report to our in-memory database
        reports_db.insert(0, new_report) # insert at the beginning for newest-first

        return {"status": "success", "detail": "Report submitted."}
        
    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during analysis")

# --- NEW: Endpoint for the Admin Dashboard ---
@app.get("/reports")
async def get_reports():
    """
    This endpoint returns all the submitted reports for the admin dashboard.
    """
    return reports_db

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

