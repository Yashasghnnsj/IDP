import os
import io
import re
import base64
import logging
from typing import Dict, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import torch
import timm
import librosa
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AcuSoundAPI")

# 1. Load Environment Variables manually from .env
openrouter_api_key = ""
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    logger.info("Loading environment variables from .env file...")
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = parts[1].strip()
                    if key == "VITE_OPENROUTER_API_KEY":
                        openrouter_api_key = val
                        os.environ["OPENROUTER_API_KEY"] = val
                        logger.info("Found OpenRouter API Key in .env!")

# Fallback to os.environ if not found in .env
if not openrouter_api_key:
    openrouter_api_key = os.environ.get("OPENROUTER_API_KEY", "")

# 2. Setup FastAPI
app = FastAPI(title="AcuSound AI Respiratory Diagnostic API")

# Enable CORS for local cross-origin testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Model Configuration & Loading
CLASS_NAMES = ['Asthma', 'Bronchiectasis', 'Bronchiolitis', 'COPD', 'Healthy', 'LRTI', 'Pneumonia', 'URTI']
MODEL_PATH = "acusound_final_model.pth"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

logger.info(f"Using device: {DEVICE}")

# Initialize model
try:
    logger.info("Initializing EfficientNetB0 model...")
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=len(CLASS_NAMES))
    
    if os.path.exists(MODEL_PATH):
        logger.info(f"Loading weights from {MODEL_PATH}...")
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        logger.info("Weights loaded successfully!")
    else:
        logger.warning(f"Model file {MODEL_PATH} not found in the root! Ensure it is unzipped/placed in the root directory.")
    
    model = model.to(DEVICE)
    model.eval()
    
    # Initialize GradCAM
    # timm's efficientnet head is usually 'conv_head'
    cam = GradCAM(model=model, target_layers=[model.conv_head])
    logger.info("GradCAM successfully initialized!")

except Exception as e:
    logger.error(f"Error loading PyTorch model: {e}")
    model = None
    cam = None

# 4. Audio Preprocessing Utilities
def remove_silence(audio, top_db=20):
    """Remove quiet segments from the beginning and end of the audio clip"""
    intervals = librosa.effects.split(audio, top_db=top_db)
    if len(intervals) == 0:
        return audio
    return np.concatenate([audio[start:end] for start, end in intervals])

def audio_to_logmel_inference(audio, sr=16000, n_mels=224, segment_seconds=5):
    """
    Standardize the audio segment to exactly segment_seconds (padding or truncating)
    and convert to log-mel spectrogram. Stacks 3 channels to match EfficientNet.
    """
    # Force exactly segment_seconds
    target_length = sr * segment_seconds
    if len(audio) < target_length:
        audio = np.pad(audio, (0, target_length - len(audio)))
    else:
        audio = audio[:target_length]
        
    # Extract Mel Spectrogram
    mel = librosa.feature.melspectrogram(
        y=audio,
        sr=sr,
        n_mels=n_mels
    )
    mel = librosa.power_to_db(mel, ref=np.max)
    mel = librosa.util.normalize(mel)
    
    # Stack to 3 channels for CNN input
    mel_3ch = np.stack([mel] * 3, axis=-1)
    return mel_3ch.astype(np.float32), mel

def get_risk_level(pred_class: str) -> str:
    """Helper to return risk levels based on predicted respiratory class"""
    low_risk = ["Healthy"]
    moderate_risk = ["Asthma", "URTI", "Bronchiolitis"]
    high_risk = ["COPD", "Bronchiectasis", "Pneumonia", "LRTI"]
    
    if pred_class in low_risk:
        return "Low"
    elif pred_class in moderate_risk:
        return "Moderate"
    else:
        return "High"

def get_disease_description(pred_class: str) -> str:
    """Helper to return descriptive class notes"""
    descriptions = {
        "Asthma": "Inflammatory airway condition causing wheezing and shortness of breath.",
        "Bronchiectasis": "Chronic lung condition where airways become abnormally widened and scarred.",
        "Bronchiolitis": "Common lung infection in young children/infants causing airway inflammation.",
        "COPD": "Chronic obstructive pulmonary disease, causing long-term breathing difficulty.",
        "Healthy": "No significant respiratory anomalies or abnormal sounds detected.",
        "LRTI": "Lower respiratory tract infection affecting the lungs and bronchial tubes.",
        "Pneumonia": "Infection that inflames air sacs in one or both lungs, which may fill with fluid.",
        "URTI": "Upper respiratory tract infection, commonly known as a cold or sinus infection."
    }
    return descriptions.get(pred_class, "Respiratory tract assessment completed.")

# 5. API Endpoints
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": DEVICE,
        "classes": CLASS_NAMES
    }

@app.post("/api/analyze")
async def analyze_audio(audio: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="PyTorch model is not loaded on the server.")
    
    import time
    start_time = time.time()
    try:
        logger.info(f"Received file: {audio.filename}, content-type: {audio.content_type}")
        
        # Read file bytes into memory
        audio_bytes = await audio.read()
        read_time = time.time()
        logger.info(f"Time to read audio bytes: {read_time - start_time:.2f}s")
        
        # Load audio using librosa (handles wav, webm, mp3 using audioread / soundfile fallbacks)
        try:
            # We save the file bytes to a temporary file because soundfile/audioread sometimes 
            # requires a real file path to read compressed containers (like WebM) on Windows
            temp_filename = "temp_audio_upload.wav"
            if audio.filename and "." in audio.filename:
                ext = audio.filename.split(".")[-1]
                temp_filename = f"temp_audio_upload.{ext}"
                
            with open(temp_filename, "wb") as f:
                f.write(audio_bytes)
                
            # Load audio using librosa
            y_audio, sr = librosa.load(temp_filename, sr=16000)
            
            # Clean up temp file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
        except Exception as e:
            logger.warning(f"Failed to read file directly, attempting direct BytesIO load: {e}")
            y_audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        
        load_time = time.time()
        logger.info(f"Time to load audio: {load_time - read_time:.2f}s")

        # Preprocess
        y_audio = remove_silence(y_audio, top_db=20)
        mel_3ch, mel_single = audio_to_logmel_inference(y_audio, sr=16000)
        
        preprocess_time = time.time()
        logger.info(f"Time to preprocess audio: {preprocess_time - load_time:.2f}s")
        
        # Build tensor for model input (HWC -> BCHW)
        tensor = torch.tensor(mel_3ch.transpose(2, 0, 1), dtype=torch.float32).unsqueeze(0).to(DEVICE)
        
        # 6. PyTorch Model Inference
        with torch.no_grad():
            logits = model(tensor)
            probs = torch.softmax(logits, dim=1)[0]
            
        pred_idx = torch.argmax(probs).item()
        pred_class = CLASS_NAMES[pred_idx]
        confidence = float(probs[pred_idx])
        
        inference_time = time.time()
        logger.info(f"Time for model inference: {inference_time - preprocess_time:.2f}s")
        logger.info(f"Prediction: {pred_class} with {confidence:.2%} confidence")

        # 7. GradCAM Visual Generation (Optional - Generate in background)
        heatmap_b64 = ""
        mel_b64 = ""
        try:
            # Run GradCAM
            grayscale_cam = cam(input_tensor=tensor)[0]
            
            # Normalize spectrogram for RGB overlay
            rgb_mel = np.stack([(mel_single - mel_single.min()) / (mel_single.max() - mel_single.min() + 1e-8)] * 3, axis=-1)
            overlay = show_cam_on_image(rgb_mel.astype(np.float32), grayscale_cam, use_rgb=True)
            
            # Convert overlay to Base64 PNG
            buf_heat = io.BytesIO()
            Image.fromarray(overlay).save(buf_heat, format='PNG')
            heatmap_b64 = base64.b64encode(buf_heat.getvalue()).decode('utf-8')
            
            # Convert standard Spectrogram to Base64 PNG (for side-by-side or clean view)
            fig, ax = plt.subplots(figsize=(4, 4))
            ax.imshow(mel_single, aspect='auto', origin='lower', cmap='magma')
            ax.axis('off')
            buf_mel = io.BytesIO()
            plt.savefig(buf_mel, format='png', bbox_inches='tight', pad_inches=0)
            plt.close(fig)
            mel_b64 = base64.b64encode(buf_mel.getvalue()).decode('utf-8')
            
            gradcam_time = time.time()
            logger.info(f"Time for GradCAM generation: {gradcam_time - inference_time:.2f}s")
        except Exception as cam_err:
            logger.error(f"Error generating GradCAM heatmap: {cam_err}")
            gradcam_time = time.time()

        # 8. Generate Fallback Explanation (Fast Local Generation)
        risk = get_risk_level(pred_class)
        desc = get_disease_description(pred_class)
        explanation = f"""### Respiratory Sound Analysis Result

Our AI classifier detected features suggestive of **{pred_class}** with **{confidence * 100:.1f}% confidence** (classified as **{risk} Risk**).

* **About this finding:** {desc}
* **Highlighted patterns:** The visual GradCAM heatmap highlights the key spectral regions in your breathing sound where our neural network identified abnormal wheezing, crackles, or breathing signatures.
* **Suggested Action:** 
  * Rest in a well-ventilated room.
  * Practice slow, deep belly breathing.
  * Keep track of your symptoms (cough, temperature, shortness of breath).

*AcuSound AI is not a substitute for professional medical diagnosis. Please consult a doctor for personalized medical advice.*"""
        
        # Return response immediately - don't wait for LLM
        total_time = time.time()
        logger.info(f"Total API response time: {total_time - start_time:.2f}s")
        
        # Return full payload to client PWA
        return {
            "predicted_class": pred_class,
            "confidence": confidence,
            "risk": get_risk_level(pred_class),
            "description": get_disease_description(pred_class),
            "all_probabilities": {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))},
            "heatmap_b64": heatmap_b64,
            "mel_b64": mel_b64,
            "llm_explanation": explanation
        }

    except Exception as e:
        logger.error(f"Error processing /api/analyze: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("Starting AcuSound FastAPI Server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
