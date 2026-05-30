"""
Audio data processing and dataset handling
"""
import numpy as np
import librosa
from audiomentations import Compose, AddGaussianNoise, PitchShift, TimeStretch
import torch
from torch.utils.data import Dataset
from pathlib import Path
from tqdm import tqdm
from config import Config


def remove_silence(audio, top_db=20):
    """Remove silence from audio"""
    intervals = librosa.effects.split(audio, top_db=top_db)
    
    if len(intervals) == 0:
        return audio
    
    return np.concatenate([
        audio[start:end]
        for start, end in intervals
    ])


def segment_audio(audio, sr=16000, segment_seconds=5):
    """Segment audio into fixed-length chunks"""
    segment_length = sr * segment_seconds
    segments = []
    
    for i in range(0, len(audio), segment_length):
        seg = audio[i:i+segment_length]
        
        if len(seg) >= segment_length:
            segments.append(seg)
    
    return segments


def get_augmentation():
    """Get audio augmentation pipeline"""
    return Compose([
        AddGaussianNoise(
            min_amplitude=Config.AUGMENTATION["gaussian_noise"]["min_amplitude"],
            max_amplitude=Config.AUGMENTATION["gaussian_noise"]["max_amplitude"],
            p=Config.AUGMENTATION["gaussian_noise"]["p"]
        ),
        PitchShift(
            min_semitones=Config.AUGMENTATION["pitch_shift"]["min_semitones"],
            max_semitones=Config.AUGMENTATION["pitch_shift"]["max_semitones"],
            p=Config.AUGMENTATION["pitch_shift"]["p"]
        ),
        TimeStretch(
            min_rate=Config.AUGMENTATION["time_stretch"]["min_rate"],
            max_rate=Config.AUGMENTATION["time_stretch"]["max_rate"],
            p=Config.AUGMENTATION["time_stretch"]["p"]
        )
    ])


def spec_augment(spec):
    """Apply SpecAugment to spectrogram"""
    import random
    spec = spec.copy()
    
    # Frequency masking
    freq_mask = random.randint(
        Config.AUGMENTATION["freq_mask"]["min_range"],
        Config.AUGMENTATION["freq_mask"]["max_range"]
    )
    freq_start = random.randint(0, max(0, spec.shape[0] - freq_mask))
    spec[freq_start:freq_start+freq_mask, :] = 0
    
    # Time masking
    time_mask = random.randint(
        Config.AUGMENTATION["time_mask"]["min_range"],
        Config.AUGMENTATION["time_mask"]["max_range"]
    )
    time_start = random.randint(0, max(0, spec.shape[1] - time_mask))
    spec[:, time_start:time_start+time_mask] = 0
    
    return spec


def audio_to_logmel(audio, sr=None):
    """Convert audio to log-mel spectrogram"""
    if sr is None:
        sr = Config.SAMPLE_RATE
    
    mel = librosa.feature.melspectrogram(
        y=audio,
        sr=sr,
        n_mels=Config.N_MELS
    )
    
    mel = librosa.power_to_db(mel, ref=np.max)
    mel = librosa.util.normalize(mel)
    mel = spec_augment(mel)
    
    # Stack to 3 channels for CNN
    mel = np.stack([mel] * 3, axis=-1)
    
    return mel.astype(np.float32)


class RespiratoryDataset(Dataset):
    """PyTorch dataset for respiratory sounds"""
    
    def __init__(self, X, y, transform=None):
        self.X = X
        self.y = y
        self.transform = transform
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        x = torch.tensor(
            self.X[idx].transpose(2, 0, 1),  # HWC -> CHW
            dtype=torch.float32
        )
        
        y = torch.tensor(
            self.y[idx],
            dtype=torch.long
        )
        
        return x, y


def load_data(config=None):
    """
    Load and preprocess ICBHI dataset
    Returns: X_train, X_test, y_train, y_test, class_names, class_weights
    """
    if config is None:
        config = Config()
    
    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.utils.class_weight import compute_class_weight
    
    # Load diagnosis mapping
    diagnosis_df = pd.read_csv(config.DIAG_CSV, header=None)
    diagnosis_df.columns = ["patient_id", "diagnosis"]
    
    class_names = sorted(diagnosis_df["diagnosis"].unique())
    class2idx = {c: i for i, c in enumerate(class_names)}
    
    print(f"Classes: {class_names}")
    
    # Load and process audio files
    samples = []
    augment = get_augmentation()
    wav_files = list(config.AUDIO_DIR.glob("*.wav"))
    
    print(f"Processing {len(wav_files)} audio files...")
    
    for wav_path in tqdm(wav_files):
        try:
            patient_id = int(wav_path.stem.split("_")[0])
            
            row = diagnosis_df[diagnosis_df["patient_id"] == patient_id]
            if len(row) == 0:
                continue
            
            label = row.iloc[0]["diagnosis"]
            label_idx = class2idx[label]
            
            # Load audio
            audio, sr = librosa.load(
                wav_path,
                sr=config.SAMPLE_RATE
            )
            
            audio = remove_silence(audio, top_db=config.TOP_DB)
            segments = segment_audio(
                audio,
                sr=config.SAMPLE_RATE,
                segment_seconds=config.SEGMENT_SECONDS
            )
            
            # Process segments
            for seg in segments[:config.MAX_SEGMENTS_PER_AUDIO]:
                seg = augment(samples=seg, sample_rate=config.SAMPLE_RATE)
                spec = audio_to_logmel(seg, sr=config.SAMPLE_RATE)
                samples.append((spec, label_idx))
        
        except Exception as e:
            print(f"Error processing {wav_path}: {e}")
            continue
    
    print(f"Total samples created: {len(samples)}")
    
    # Convert to numpy arrays
    X = np.array([s[0] for s in samples])
    y = np.array([s[1] for s in samples])
    
    print(f"Dataset shape: {X.shape}, Labels shape: {y.shape}")
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=config.TEST_SIZE,
        stratify=y,
        random_state=config.SEED
    )
    
    # Compute class weights
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    
    class_weights = torch.tensor(
        class_weights,
        dtype=torch.float32
    )
    
    return X_train, X_test, y_train, y_test, class_names, class_weights
