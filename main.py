import os
import io
import re
import base64
import logging
import tempfile
from typing import Dict, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import torch
import timm
import librosa
import numpy as np
import joblib
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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Load Environment Variables manually from .env
openrouter_api_key = ""
env_path = os.path.join(BASE_DIR, ".env")
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
CLASSES_PATH = os.path.join(BASE_DIR, "acusound_final_model.classes.txt")
if os.path.exists(CLASSES_PATH):
    with open(CLASSES_PATH, "r") as f:
        CLASS_NAMES = [line.strip() for line in f if line.strip()]

MODEL_PATH = os.path.join(BASE_DIR, "acusound_final_model.pth")
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

# 3b. Load Traditional ML Models (SVM, KNN, RF)
TRADITIONAL_MODELS_DIR = os.path.join(BASE_DIR, "checkpoints", "traditional")
traditional_models = {}
traditional_scaler = None
traditional_encoder = None

if os.path.exists(TRADITIONAL_MODELS_DIR):
    logger.info(f"Loading traditional ML models from {TRADITIONAL_MODELS_DIR}...")
    for name in ["svm", "knn", "rf"]:
        path = os.path.join(TRADITIONAL_MODELS_DIR, f"{name}.joblib")
        if os.path.exists(path):
            try:
                traditional_models[name] = joblib.load(path)
                logger.info(f"  Loaded {name}")
            except Exception as e:
                logger.error(f"  Failed to load {name}: {e}")

    scaler_path = os.path.join(TRADITIONAL_MODELS_DIR, "scaler.joblib")
    if os.path.exists(scaler_path):
        traditional_scaler = joblib.load(scaler_path)
        logger.info("  Loaded scaler")

    encoder_path = os.path.join(TRADITIONAL_MODELS_DIR, "label_encoder.joblib")
    if os.path.exists(encoder_path):
        traditional_encoder = joblib.load(encoder_path)
        logger.info("  Loaded label_encoder")

    if traditional_models:
        logger.info(f"Traditional ML models available: {list(traditional_models.keys())}")
else:
    logger.warning("No traditional ML models found. Run 'python data/train_traditional.py' first.")

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

@app.get("/api/models")
async def list_models():
    available = [{"id": "efficientnet", "name": "Deep Learning (EfficientNet)", "type": "deep_learning", "available": model is not None}]
    
    traditional_info = {
        "svm": "Support Vector Machine (SVM)",
        "knn": "K-Nearest Neighbors (KNN)",
        "rf": "Random Forest"
    }
    for mid, mname in traditional_info.items():
        available.append({
            "id": mid,
            "name": mname,
            "type": "traditional",
            "available": mid in traditional_models
        })
    
    return {"models": available}

def extract_mfcc_features(audio, sr=16000, n_mfcc=40):
    """Extract MFCC features matching train_traditional.py preprocessing."""
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    return np.mean(mfcc.T, axis=0)

@app.post("/api/analyze")
async def analyze_audio(audio: UploadFile = File(...), model_type: str = Form("efficientnet")):
    if model is None and model_type == "efficientnet":
        raise HTTPException(status_code=500, detail="PyTorch model is not loaded on the server.")
    if model_type in ("svm", "knn", "rf") and model_type not in traditional_models:
        raise HTTPException(status_code=500, detail=f"Traditional model '{model_type}' is not loaded. Run 'python data/train_traditional.py' first.")
    
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
            ext = "wav"
            if audio.filename and "." in audio.filename:
                ext = audio.filename.split(".")[-1]

            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            y_audio, sr = librosa.load(tmp_path, sr=16000)

            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
        except Exception as e:
            logger.warning(f"Failed to read file directly, attempting direct BytesIO load: {e}")
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)
            y_audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        
        load_time = time.time()
        logger.info(f"Time to load audio: {load_time - read_time:.2f}s")

        # Preprocess
        y_audio = remove_silence(y_audio, top_db=20)
        
        preprocess_time = time.time()
        logger.info(f"Time to preprocess audio: {preprocess_time - load_time:.2f}s")

        inference_start = time.time()

        if model_type == "efficientnet":
            # --- Deep Learning (EfficientNet) path ---
            mel_3ch, mel_single = audio_to_logmel_inference(y_audio, sr=16000)
            tensor = torch.tensor(mel_3ch.transpose(2, 0, 1), dtype=torch.float32).unsqueeze(0).to(DEVICE)
            
            with torch.no_grad():
                logits = model(tensor)
                probs = torch.softmax(logits, dim=1)[0]
            
            pred_idx = torch.argmax(probs).item()
            pred_class = CLASS_NAMES[pred_idx]
            confidence = float(probs[pred_idx])
            
            logger.info(f"EfficientNet: {pred_class} with {confidence:.2%} confidence")

            # GradCAM
            heatmap_b64 = ""
            mel_b64 = ""
            try:
                grayscale_cam = cam(input_tensor=tensor)[0]
                rgb_mel = np.stack([(mel_single - mel_single.min()) / (mel_single.max() - mel_single.min() + 1e-8)] * 3, axis=-1)
                overlay = show_cam_on_image(rgb_mel.astype(np.float32), grayscale_cam, use_rgb=True)
                buf_heat = io.BytesIO()
                Image.fromarray(overlay).save(buf_heat, format='PNG')
                heatmap_b64 = base64.b64encode(buf_heat.getvalue()).decode('utf-8')
                
                fig, ax = plt.subplots(figsize=(4, 4))
                ax.imshow(mel_single, aspect='auto', origin='lower', cmap='magma')
                ax.axis('off')
                buf_mel = io.BytesIO()
                plt.savefig(buf_mel, format='png', bbox_inches='tight', pad_inches=0)
                plt.close(fig)
                mel_b64 = base64.b64encode(buf_mel.getvalue()).decode('utf-8')
                
                logger.info(f"GradCAM generated in {time.time() - inference_start:.2f}s")
            except Exception as cam_err:
                logger.error(f"GradCAM error: {cam_err}")

            all_probs = {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))}

        else:
            # --- Traditional ML path (svm, knn, rf) ---
            mfcc_feat = extract_mfcc_features(y_audio, sr=16000)
            feat_scaled = traditional_scaler.transform([mfcc_feat])
            
            model_obj = traditional_models[model_type]
            raw_pred = model_obj.predict(feat_scaled)[0]
            pred_class = traditional_encoder.inverse_transform([raw_pred])[0]
            pred_class = str(pred_class)
            
            if hasattr(model_obj, "predict_proba"):
                raw_probs = model_obj.predict_proba(feat_scaled)[0]
                confidence = float(max(raw_probs))
                all_probs = {}
                for i, p in enumerate(raw_probs):
                    cls_name = str(traditional_encoder.inverse_transform([i])[0])
                    all_probs[cls_name] = float(p)
            else:
                confidence = 0.85
                all_probs = {pred_class: confidence}
            
            # Generate mel spectrogram for all traditional models too
            heatmap_b64 = ""
            mel_b64 = ""
            try:
                _, mel_single = audio_to_logmel_inference(y_audio, sr=16000)
                fig, ax = plt.subplots(figsize=(4, 4))
                ax.imshow(mel_single, aspect='auto', origin='lower', cmap='magma')
                ax.axis('off')
                buf_mel = io.BytesIO()
                plt.savefig(buf_mel, format='png', bbox_inches='tight', pad_inches=0)
                plt.close(fig)
                mel_b64 = base64.b64encode(buf_mel.getvalue()).decode('utf-8')
                logger.info(f"Mel spectrogram generated for {model_type}")
            except Exception as mel_err:
                logger.error(f"Mel spectrogram error for {model_type}: {mel_err}")
            
            logger.info(f"{model_type}: {pred_class} with {confidence:.2%} confidence")

        logger.info(f"Total inference time: {time.time() - inference_start:.2f}s")

        # Generate explanation
        risk = get_risk_level(pred_class)
        desc = get_disease_description(pred_class)
        
        model_label_map = {"efficientnet": "Deep Learning (EfficientNet)", "svm": "SVM", "knn": "KNN", "rf": "Random Forest"}
        model_label = model_label_map.get(model_type, model_type)
        
        patterns_text = "The visual GradCAM heatmap highlights the key spectral regions in your breathing sound where our neural network identified abnormal wheezing, crackles, or breathing signatures." if model_type == "efficientnet" else "The model analyzed acoustic features from your breathing sound to identify patterns consistent with this classification."
        
        explanation = f"""### Respiratory Sound Analysis Result

Our AI classifier detected features suggestive of **{pred_class}** with **{confidence * 100:.1f}% confidence** (classified as **{risk} Risk**).

**Model used:** {model_label}

* **About this finding:** {desc}
* **Highlighted patterns:** {patterns_text}
* **Suggested Action:** 
  * Rest in a well-ventilated room.
  * Practice slow, deep belly breathing.
  * Keep track of your symptoms.

*AcuSound AI is not a substitute for professional medical diagnosis. Please consult a doctor for personalized medical advice.*"""

        # Call OpenRouter (for all models when mel_b64 is available)
        if openrouter_api_key and mel_b64:
            try:
                logger.info("Calling OpenRouter VLM for detailed report...")
                prompt = f"""You are a professional medical AI assistant.
A patient has uploaded a respiratory sound which was analyzed.
Predicted Disease: {pred_class}
Confidence: {confidence * 100:.1f}%
Risk Level: {risk}

Please analyze the provided mel-spectrogram image and generate a detailed and professional respiratory analysis report. 
Highlight the important findings based on the spectrogram, relate them to the predicted disease ({pred_class}), and offer general wellness advice. 
Keep it concise, use markdown formatting, and always include a medical disclaimer at the end."""
                
                vlm_models = [
                    "meta-llama/llama-3.2-11b-vision-instruct:free",
                    "meta-llama/llama-3.3-70b-instruct:free",
                    "google/gemma-4-31b-it:free",
                ]
                
                headers = {
                    "Authorization": f"Bearer {openrouter_api_key}",
                    "Content-Type": "application/json"
                }
                
                for vlm_model in vlm_models:
                    try:
                        payload = {
                            "model": vlm_model,
                            "messages": [
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": prompt},
                                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{mel_b64}"}}
                                    ]
                                }
                            ]
                        }
                        
                        with httpx.Client(timeout=30.0) as client:
                            resp = client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                            resp.raise_for_status()
                            result_json = resp.json()
                            explanation = result_json["choices"][0]["message"]["content"]
                            logger.info(f"OpenRouter VLM ({vlm_model}) response generated successfully.")
                            break
                            
                    except Exception as vlm_err:
                        logger.warning(f"VLM model {vlm_model} failed: {vlm_err}. Trying next...")
                        continue
                    
            except Exception as llm_err:
                logger.error(f"OpenRouter VLM failed: {llm_err}. Using fallback.")

        total_time = time.time()
        logger.info(f"Total API response time: {total_time - start_time:.2f}s")
        
        return {
            "predicted_class": pred_class,
            "confidence": confidence,
            "risk": risk,
            "description": desc,
            "all_probabilities": all_probs,
            "heatmap_b64": heatmap_b64,
            "mel_b64": mel_b64,
            "llm_explanation": explanation,
            "model_used": model_type
        }

    except Exception as e:
        logger.error(f"Error processing /api/analyze: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("Starting AcuSound FastAPI Server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
