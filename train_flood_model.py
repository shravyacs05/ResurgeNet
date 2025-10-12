import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.applications import mobilenet
from tensorflow.keras.optimizers import Adam
import os

print("Starting Flood Detection Model TRAINING...")

# --- Data Setup ---
base_dir = 'data'
train_path = os.path.join(base_dir, 'train')
valid_path = os.path.join(base_dir, 'valid')

if not all(os.path.exists(p) for p in [train_path, valid_path]):
    print(f"❌ Error: Make sure '{train_path}' and '{valid_path}' exist and contain images.")
    exit()

print("Loading and preprocessing image data...")
# --- UPGRADE 1: Add Data Augmentation ---
# This creates new training examples by altering existing ones, making the model more robust.
train_batches = ImageDataGenerator(
    preprocessing_function=mobilenet.preprocess_input,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
).flow_from_directory(
    directory=train_path,
    target_size=(224, 224),
    batch_size=32,  # Increased batch size for more data
    class_mode='categorical'
)

# NOTE: Do not augment validation data. The model should be validated on original images.
valid_batches = ImageDataGenerator(preprocessing_function=mobilenet.preprocess_input).flow_from_directory(
    directory=valid_path,
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical'
)

# --- Model Building (Fine-Tuning) ---
print("Building fine-tuned MobileNet model...")
base_model = mobilenet.MobileNet(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.2)(x)
output = Dense(units=2, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

# Fine-tune more layers for better performance
for layer in base_model.layers[:-20]: # Freeze all but the top 20 layers
    layer.trainable = False
for layer in base_model.layers[-20:]: # Unfreeze the top 20 layers
    layer.trainable = True


# --- Model Compilation and Training ---
print("Compiling and training the model...")
model.compile(optimizer=Adam(learning_rate=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

# --- UPGRADE 2: Increase Epochs ---
# Give the model more time to learn from the larger dataset.
model.fit(
    x=train_batches,
    epochs=25,
    validation_data=valid_batches,
    verbose=2
)

# --- Save the Trained Model ---
model_save_path = "fine_tuned_flood_detection_model.keras"
model.save(model_save_path)
print(f"\n✅ Flood model training complete. Model saved to '{model_save_path}'.")