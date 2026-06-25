"""
Inference script for trained AcuSound model

Usage:
    python inference.py path/to/audio.wav --model path/to/model.pth
"""
import argparse
import torch
import numpy as np
import librosa
from pathlib import Path
from data_handler import remove_silence, audio_to_logmel
from config import Config


def load_class_names(model_path, checkpoint=None):
    """Load class names saved beside a trained model."""
    if isinstance(checkpoint, dict) and "class_names" in checkpoint:
        return checkpoint["class_names"]

    class_file = Path(model_path).with_suffix(".classes.txt")
    if class_file.exists():
        return [
            line.strip()
            for line in class_file.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]

    return Config.CLASS_NAMES


def predict_audio(audio_path, model_path, config=None):
    """
    Predict diagnosis for an audio file
    
    Args:
        audio_path: Path to audio file
        model_path: Path to saved model weights
        config: Config object
    
    Returns:
        predicted_class, confidence_score, all_probabilities
    """
    if config is None:
        config = Config()
    
    device = torch.device(config.DEVICE)
    
    # Load and preprocess audio
    audio, sr = librosa.load(audio_path, sr=config.SAMPLE_RATE)
    audio = remove_silence(audio, top_db=config.TOP_DB)
    
    # Convert to spectrogram
    spec = audio_to_logmel(audio, sr=config.SAMPLE_RATE, config=config)
    
    # Prepare tensor
    x = torch.tensor(spec.transpose(2, 0, 1), dtype=torch.float32)
    x = x.unsqueeze(0).to(device)  # Add batch dimension
    
    import timm

    checkpoint = torch.load(model_path, map_location=device)
    class_names = load_class_names(model_path, checkpoint=checkpoint)
    model = timm.create_model(
        config.MODEL_NAME,
        pretrained=False,
        num_classes=len(class_names)
    )

    state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()
    
    # Inference
    with torch.no_grad():
        logits = model(x)
        probabilities = torch.softmax(logits, dim=1)
        predicted_idx = torch.argmax(logits, dim=1).item()
        confidence = probabilities[0, predicted_idx].item()
    
    return class_names, predicted_idx, confidence, probabilities[0].cpu().numpy()


def main(args):
    audio_path = Path(args.audio)
    model_path = Path(args.model)
    config = Config()
    config.DEVICE = args.device
    
    if not audio_path.exists():
        print(f"Error: Audio file not found: {audio_path}")
        return
    
    if not model_path.exists():
        print(f"Error: Model file not found: {model_path}")
        return
    
    print(f"Audio file: {audio_path}")
    print(f"Model: {model_path}")
    print(f"Processing...")
    
    class_names, predicted_idx, confidence, probabilities = predict_audio(
        audio_path,
        model_path,
        config=config,
    )
    
    print("\n" + "="*60)
    print("PREDICTION RESULT")
    print("="*60)
    print(f"Predicted Class: {class_names[predicted_idx]}")
    print(f"Confidence: {confidence:.2%}")
    print("\nClass Probabilities:")
    for i, class_name in enumerate(class_names):
        print(f"  {class_name}: {probabilities[i]:.2%}")
    print("="*60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run inference on audio file with trained model"
    )
    
    parser.add_argument(
        "audio",
        help="Path to audio file"
    )
    
    parser.add_argument(
        "--model",
        type=str,
        default="checkpoints/acusound_final_model.pth",
        help="Path to trained model weights"
    )
    
    parser.add_argument(
        "--device",
        type=str,
        choices=["cuda", "cpu"],
        default="cuda",
        help="Device to use for inference"
    )
    
    args = parser.parse_args()
    
    main(args)
