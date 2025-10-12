# This file loads the pre-trained VGG16 model.
# We are switching models to bypass a persistent loading error with EfficientNetB0.

import fix_ssl # Applies the SSL fix
import tensorflow as tf
# Import the VGG16 model instead of EfficientNetB0
from tensorflow.keras.applications import VGG16

print("Attempting to load VGG16 model...")

# Load the VGG16 model, which is a robust and reliable alternative.
# Keras will download the weights the first time this is run.
model = VGG16(
    weights='imagenet',
    # We don't need the custom input_shape for VGG16 as it defaults correctly to color.
)

print("✅ VGG16 model loaded successfully!")

