import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import pickle
import warnings

# Ignore warnings for a cleaner output
warnings.filterwarnings("ignore")

print("Starting model training process for Forest Fire Prediction...")

# --- 1. Load Data using Pandas ---
# This is a more robust way to load the data and select columns
try:
    df = pd.read_csv("Forest_fire.csv")
    # Clean column names by removing leading/trailing spaces, which is a common issue
    df.columns = df.columns.str.strip()
except FileNotFoundError:
    print("❌ Error: Forest_fire.csv not found. Please make sure the file is in the same directory.")
    exit()

print("Dataset loaded successfully.")

# --- 2. Prepare the Data ---
# Define the features (X) and the target variable (y) by name
X = df[['Oxygen', 'Temperature', 'Humidity']]
y = df['Fire Occurrence']

# Convert to integer types as expected by the model
y = y.astype('int')
X = X.astype('int')

print("Data prepared for training.")

# --- 3. Split the Data ---
# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)

# --- 4. Train the Model ---
# Initialize and train the Logistic Regression model
log_reg = LogisticRegression()
log_reg.fit(X_train, y_train)

print("Model training complete.")

# --- 5. Save the Trained Model ---
# Save the trained model to a file named 'model.pkl' using pickle
with open('model.pkl', 'wb') as f:
    pickle.dump(log_reg, f)

print("✅ Model has been trained and saved as model.pkl")

# --- 6. (Optional) Test the loaded model ---
with open('model.pkl', 'rb') as f:
    loaded_model = pickle.load(f)

# Create a sample input to test the model
sample_input = np.array([[25, 40, 70]]) # Example: [Oxygen, Temperature, Humidity]
prediction_prob = loaded_model.predict_proba(sample_input)
print(f"\nTest prediction on sample data [Oxygen=25, Temp=40, Humidity=70]:")
print(f"   -> Probability of Fire: {prediction_prob[0][1]*100:.2f}%")
