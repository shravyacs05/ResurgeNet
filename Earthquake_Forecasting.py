# This script trains a model to predict earthquake magnitude based on historical data.
# Run this file once to generate the 'earthquake_model.pkl' file.

import numpy as np
import pandas as pd
import joblib
import re
from sklearn.model_selection import train_test_split
from lightgbm import LGBMRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_squared_error

print("Starting Earthquake Model Training...")

# 1. Load and Examine the Dataset
try:
    dataset = pd.read_csv("Earthquake_dataset.csv")
except FileNotFoundError:
    print("❌ Error: Earthquake_dataset.csv not found. Please download it first.")
    exit()

print("Dataset loaded successfully. Shape:", dataset.shape)

# 2. Data Cleaning and Preprocessing
print("Cleaning and preprocessing data...")

# Fill missing values for key numeric columns (updated to avoid FutureWarning)
for col in ['nst', 'gap', 'rms']:
    dataset[col] = dataset[col].replace({"": np.nan})
    dataset[col] = dataset[col].fillna(dataset[col].mode().iloc[0])

# Simplify and standardize the 'place' column
simplified_places = [re.sub('^(.*of )',"", place) for place in dataset['place']]
dataset['place'] = simplified_places

# Apply one-hot encoding to the 'place' column
df = pd.get_dummies(dataset, columns=['place'])

# --- THE FIX: Sanitize column names to remove special characters ---
df.columns = [re.sub(r'[^A-Za-z0-9_]+', '', col) for col in df.columns]
print("Column names sanitized for LightGBM compatibility.")
# --- END FIX ---

# 3. Feature Selection
features_to_drop = [
    'time', 'latitude', 'longitude', 'mag', 'magType', 'dmin', 'net', 'id',
    'updated', 'type', 'horizontalError', 'depthError', 'magError',
    'magNst', 'status', 'locationSource', 'magSource'
]
# Sanitize the drop list as well to match the new column names
sanitized_features_to_drop = [re.sub(r'[^A-Za-z0-9_]+', '', col) for col in features_to_drop]

X = df.drop(sanitized_features_to_drop, axis=1, errors='ignore')
y = df[['mag']]


print(f"Training with {X.shape[1]} features.")

# 4. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=13)

# 5. Model Training
print("Training the LightGBM Regressor model...")

lgbm_model = MultiOutputRegressor(LGBMRegressor(
    learning_rate=0.1,
    max_depth=5,
    n_estimators=300,
    num_leaves=30,
    random_state=13
))

lgbm_model.fit(X_train, y_train)

# 6. Model Evaluation
score = lgbm_model.score(X_test, y_test)
y_pred = lgbm_model.predict(X_test)

# --- THE FIX for TypeError ---
# Calculate Root Mean Squared Error manually for broader compatibility
mse = mean_squared_error(y_test, y_pred)
rms = np.sqrt(mse)
# --- END FIX ---

print(f"\nModel Evaluation Complete:")
print(f"  - R^2 Score: {score:.4f}")
print(f"  - Root Mean Squared Error: {rms:.4f}")

# 7. Save the Trained Model
model_filename = 'earthquake_model.pkl'
joblib.dump(lgbm_model, model_filename)

print(f"\n✅ Model training complete. Best model saved as '{model_filename}'")

