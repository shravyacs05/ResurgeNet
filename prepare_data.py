import os
import random
import shutil

print("Starting automatic data splitting...")

# --- 1. DEFINE PATHS ---
# --- THE ONLY CHANGE IS HERE ---
# Update this to the exact name of your unzipped folder
source_dir = "archive (1)"

# Paths for our new structured directories
base_dir = "data"
train_dir = os.path.join(base_dir, "train")
valid_dir = os.path.join(base_dir, "valid")

# --- 2. DEFINE PARAMETERS ---
# --- AND A SMALL CHANGE HERE ---
# Update to match the folder names 'Flood' and 'Non_Flood'
categories = ["Flood", "Non_Flood"]
split_ratio = 0.8

# --- 3. CREATE DIRECTORIES ---
def create_dirs():
    for cat in categories:
        # This logic correctly creates 'Flooding' and 'No Flooding' folders for the training script
        target_train_path = os.path.join(train_dir, "Flooding" if cat == "Flood" else "No Flooding")
        target_valid_path = os.path.join(valid_dir, "Flooding" if cat == "Flood" else "No Flooding")

        os.makedirs(target_train_path, exist_ok=True)
        os.makedirs(target_valid_path, exist_ok=True)
    print("Train and validation directories created successfully.")

# --- 4. SPLIT AND COPY FILES ---
def split_data():
    for cat in categories:
        source_cat_dir = os.path.join(source_dir, cat)

        all_files = [f for f in os.listdir(source_cat_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
        random.shuffle(all_files)

        split_point = int(len(all_files) * split_ratio)
        train_files = all_files[:split_point]
        valid_files = all_files[split_point:]

        target_train_dir = os.path.join(train_dir, "Flooding" if cat == "Flood" else "No Flooding")
        target_valid_dir = os.path.join(valid_dir, "Flooding" if cat == "Flood" else "No Flooding")

        for f in train_files:
            shutil.copy(os.path.join(source_cat_dir, f), target_train_dir)
        for f in valid_files:
            shutil.copy(os.path.join(source_cat_dir, f), target_valid_dir)

        print(f"Category '{cat}': {len(train_files)} images copied to train, {len(valid_files)} to validation.")

# --- RUN THE SCRIPT ---
if os.path.exists(base_dir):
    print("Found old 'data' directory. Removing it for a clean start.")
    shutil.rmtree(base_dir)

create_dirs()
split_data()

print("\n✅ Data splitting complete. Your 'data' folder is ready for training!")