import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications import mobilenet

# --- 1. Load the Saved Model ---
# This line runs only once when the application starts.
print("Loading the pre-trained flood detection model...")
model = tf.keras.models.load_model("fine_tuned_flood_detection_model.keras")
print("Model loaded successfully. ✅")

# Define the labels in the correct order (0: Flooding, 1: No Flooding)
LABELS = ['Flooding', 'No Flooding']

# --- 2. Create the Prediction Function ---
def predict_image(image_path):
    """
    Takes an image file path, preprocesses it, and returns the prediction.
    """
    try:
        # Load and resize the image to 224x224 pixels
        img = image.load_img(image_path, target_size=(224, 224))
        
        # Convert the image to a numpy array
        img_array = image.img_to_array(img)
        
        # Add a batch dimension (e.g., from (224, 224, 3) to (1, 224, 224, 3))
        img_array_expanded = np.expand_dims(img_array, axis=0)
        
        # Preprocess the image for the MobileNet model
        preprocessed_img = mobilenet.preprocess_input(img_array_expanded)
        
        # Make the prediction
        predictions = model.predict(preprocessed_img)
        
        # Find the index of the highest probability
        result_index = np.argmax(predictions)
        
        # Get the corresponding label
        predicted_label = LABELS[result_index]
        
        # Get the confidence score
        confidence = predictions[0][result_index] * 100
        
        # Return a structured result
        return {
            "prediction": predicted_label,
            "confidence": f"{confidence:.2f}%"
        }

    except Exception as e:
        return {"error": str(e)}