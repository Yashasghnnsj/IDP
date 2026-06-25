"""ICBHI respiratory-cycle data loading and preprocessing."""
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import librosa
import numpy as np
import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from torch.utils.data import Dataset
from tqdm import tqdm

from config import Config


VALID_RAW_AUGMENTATIONS = {"noise", "time_shift", "pitch_shift", "time_stretch"}


@dataclass(frozen=True)
class CycleSample:
    wav_path: Path
    patient_id: int
    label: int
    start_time: float
    end_time: float
    augmentation: str = ""


def remove_silence(audio, top_db=20):
    """Remove quiet regions from an audio array."""
    intervals = librosa.effects.split(audio, top_db=top_db)
    if len(intervals) == 0:
        return audio
    return np.concatenate([audio[start:end] for start, end in intervals])


def pad_or_trim(audio, target_length):
    """Return an audio array with exactly target_length samples."""
    if len(audio) < target_length:
        return np.pad(audio, (0, target_length - len(audio)))
    return audio[:target_length]


def add_noise(audio, config):
    """Add gaussian noise to raw audio."""
    aug_config = config.AUGMENTATION["gaussian_noise"]
    amplitude = np.random.uniform(
        aug_config["min_amplitude"],
        aug_config["max_amplitude"],
    )
    noise = np.random.randn(len(audio))
    return audio + amplitude * noise


def time_shift(audio, config):
    """Circularly shift raw audio left or right."""
    shift = int(np.random.uniform(
        -config.TIME_SHIFT_MAX_RATIO,
        config.TIME_SHIFT_MAX_RATIO,
    ) * len(audio))
    return np.roll(audio, shift)


def pitch_shift(audio, config):
    """Pitch-shift raw audio before spectrogram extraction."""
    aug_config = config.AUGMENTATION["pitch_shift"]
    n_steps = np.random.uniform(
        aug_config["min_semitones"],
        aug_config["max_semitones"],
    )
    return librosa.effects.pitch_shift(
        audio,
        sr=config.SAMPLE_RATE,
        n_steps=n_steps,
    )


def time_stretch(audio, config):
    """Time-stretch raw audio before spectrogram extraction."""
    aug_config = config.AUGMENTATION["time_stretch"]
    rate = np.random.uniform(
        aug_config["min_rate"],
        aug_config["max_rate"],
    )
    return librosa.effects.time_stretch(audio, rate=rate)


def apply_raw_augmentation(audio, augmentation, config):
    """Apply a named augmentation to raw audio."""
    if augmentation == "noise":
        return add_noise(audio, config)
    if augmentation == "time_shift":
        return time_shift(audio, config)
    if augmentation == "pitch_shift":
        return pitch_shift(audio, config)
    if augmentation == "time_stretch":
        return time_stretch(audio, config)
    return audio


def spec_augment(spec, config=None):
    """Apply time and frequency masking to a mel spectrogram (n_mels, time)."""
    import random

    if config is None:
        config = Config()

    spec = spec.copy()
    n_mels, n_time = spec.shape
    
    t = random.randint(1, getattr(config, "SPEC_TIME_MASK_PARAM", 10))
    t0 = random.randint(0, max(0, n_time - t))
    spec[:, t0:t0+t] = 0.0
    
    f = random.randint(1, getattr(config, "SPEC_FREQ_MASK_PARAM", 8))
    f0 = random.randint(0, max(0, n_mels - f))
    spec[f0:f0+f, :] = 0.0
    return spec


def audio_to_logmel(audio, sr=None, config=None, augment_spec=False):
    """Convert audio to a 3-channel normalized log-mel spectrogram."""
    if config is None:
        config = Config()
    if sr is None:
        sr = config.SAMPLE_RATE

    target_length = int(config.SAMPLE_RATE * config.SEGMENT_SECONDS)
    audio = pad_or_trim(audio, target_length)

    mel = librosa.feature.melspectrogram(
        y=audio,
        sr=sr,
        n_mels=config.N_MELS,
    )
    mel = librosa.power_to_db(mel, ref=np.max)
    mel = librosa.util.normalize(mel)

    if augment_spec:
        mel = spec_augment(mel, config=config)

    return np.stack([mel] * 3, axis=-1).astype(np.float32)


def read_diagnosis_csv(path):
    """Read patient diagnosis labels from the ICBHI CSV file."""
    diagnosis_df = pd.read_csv(
        path,
        sep=",",
        header=None,
        names=["patient_id", "diagnosis"],
    )
    diagnosis_df["patient_id"] = diagnosis_df["patient_id"].astype(int)
    diagnosis_df["diagnosis"] = diagnosis_df["diagnosis"].astype(str)
    return diagnosis_df


def _read_cycle_annotations(txt_path):
    return pd.read_csv(
        txt_path,
        sep=r"\s+",
        header=None,
        names=["start_time", "end_time", "crackles", "wheezes"],
        engine="python",
    )


def build_cycle_index(config=None, class_names: Optional[Iterable[str]] = None):
    """Build one sample per annotated respiratory cycle."""
    if config is None:
        config = Config()

    audio_dir = Path(config.AUDIO_DIR)
    diagnosis_csv = Path(config.DIAG_CSV)

    if not audio_dir.exists():
        raise FileNotFoundError(f"Audio folder not found: {audio_dir}")
    if not diagnosis_csv.exists():
        raise FileNotFoundError(f"Diagnosis CSV not found: {diagnosis_csv}")

    diagnosis_df = read_diagnosis_csv(diagnosis_csv)
    requested_classes = list(class_names or config.CLASS_NAMES)
    diagnosis_df = diagnosis_df[diagnosis_df["diagnosis"].isin(requested_classes)]

    class_names = [name for name in requested_classes if name in set(diagnosis_df["diagnosis"])]
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}
    diagnosis_by_patient = dict(zip(diagnosis_df["patient_id"], diagnosis_df["diagnosis"]))

    samples = []
    txt_files = sorted(audio_dir.glob("*.txt"))
    min_duration = float(config.MIN_CYCLE_SECONDS)

    for txt_path in tqdm(txt_files, desc="Indexing respiratory cycles"):
        try:
            patient_id = int(txt_path.stem.split("_")[0])
        except ValueError:
            continue

        diagnosis = diagnosis_by_patient.get(patient_id)
        if diagnosis is None:
            continue

        wav_path = txt_path.with_suffix(".wav")
        if not wav_path.exists():
            continue

        cycles = _read_cycle_annotations(txt_path)
        for row in cycles.itertuples(index=False):
            start_time = float(row.start_time)
            end_time = float(row.end_time)
            if end_time <= start_time or (end_time - start_time) < min_duration:
                continue

            samples.append(CycleSample(
                wav_path=wav_path,
                patient_id=patient_id,
                label=class_to_idx[diagnosis],
                start_time=start_time,
                end_time=end_time,
            ))

            if config.MAX_CYCLES and len(samples) >= int(config.MAX_CYCLES):
                return samples, class_names

    return samples, class_names


def split_by_patient(samples, test_size=0.2, seed=42):
    """Split cycle samples by patient id to prevent data leakage."""
    patients = {}
    for sample in samples:
        patients.setdefault(sample.patient_id, sample.label)

    patient_ids = np.array(sorted(patients.keys()))
    patient_labels = np.array([patients[patient_id] for patient_id in patient_ids])
    label_counts = np.bincount(patient_labels)
    rare_labels = {label for label, count in enumerate(label_counts) if count < 2}
    rare_patient_ids = {
        patient_id
        for patient_id, label in zip(patient_ids, patient_labels)
        if label in rare_labels
    }

    candidate_ids = np.array([
        patient_id for patient_id in patient_ids if patient_id not in rare_patient_ids
    ])
    candidate_labels = np.array([patients[patient_id] for patient_id in candidate_ids])

    if len(candidate_ids) <= 1:
        return samples, []

    _, candidate_counts = np.unique(candidate_labels, return_counts=True)
    stratify = candidate_labels if min(candidate_counts) >= 2 else None
    train_patients, val_patients = train_test_split(
        candidate_ids,
        test_size=test_size,
        random_state=seed,
        stratify=stratify,
    )

    train_patient_set = set(train_patients.tolist()) | rare_patient_ids
    train_samples = [sample for sample in samples if sample.patient_id in train_patient_set]
    val_samples = [sample for sample in samples if sample.patient_id not in train_patient_set]
    return train_samples, val_samples


def augment_minority_training_samples(train_samples, class_names, config):
    """Duplicate minority-class training cycles with named raw-audio augmentations."""
    minority_labels = {
        class_names.index(class_name)
        for class_name in config.MINORITY_AUGMENT_CLASSES
        if class_name in class_names
    }
    augmentations = [
        augmentation.strip()
        for augmentation in config.MINORITY_AUGMENTATIONS
        if augmentation.strip()
    ]
    invalid_augmentations = sorted(set(augmentations) - VALID_RAW_AUGMENTATIONS)
    if invalid_augmentations:
        raise ValueError(
            "Unknown augmentation(s): "
            + ", ".join(invalid_augmentations)
            + ". Valid values are: "
            + ", ".join(sorted(VALID_RAW_AUGMENTATIONS))
        )

    augmented_samples = []
    for sample in train_samples:
        if sample.label not in minority_labels:
            continue

        for augmentation in augmentations:
            for _ in range(getattr(config, "AUG_MULTIPLIER", 1)):
                augmented_samples.append(CycleSample(
                    wav_path=sample.wav_path,
                    patient_id=sample.patient_id,
                    label=sample.label,
                    start_time=sample.start_time,
                    end_time=sample.end_time,
                    augmentation=augmentation,
                ))

    return train_samples + augmented_samples


class RespiratoryCycleDataset(Dataset):
    """PyTorch dataset that loads one annotated respiratory cycle per item."""

    def __init__(self, samples, config=None, training=False):
        self.samples = samples
        self.config = config or Config()
        self.training = training

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        duration = sample.end_time - sample.start_time
        audio, _ = librosa.load(
            sample.wav_path,
            sr=self.config.SAMPLE_RATE,
            offset=sample.start_time,
            duration=duration,
        )

        audio = remove_silence(audio, top_db=self.config.TOP_DB)
        audio = pad_or_trim(audio, int(self.config.SAMPLE_RATE * self.config.SEGMENT_SECONDS))

        if sample.augmentation:
            audio = apply_raw_augmentation(audio, sample.augmentation, self.config)

        import random
        apply_spec = False
        if self.training and getattr(self.config, "SPEC_AUGMENT", False):
            if random.random() < 0.5:
                apply_spec = True
        
        spec = audio_to_logmel(
            audio,
            sr=self.config.SAMPLE_RATE,
            config=self.config,
            augment_spec=apply_spec,
        )
        x = torch.tensor(spec.transpose(2, 0, 1), dtype=torch.float32)
        y = torch.tensor(sample.label, dtype=torch.long)
        return x, y


def load_data(config=None):
    """Build train/validation datasets and class weights."""
    if config is None:
        config = Config()

    samples, class_names = build_cycle_index(config)
    if not samples:
        raise RuntimeError("No respiratory cycles were found. Check dataset paths and labels.")

    train_samples, val_samples = split_by_patient(
        samples,
        test_size=config.VAL_SIZE,
        seed=config.SEED,
    )
    train_samples = augment_minority_training_samples(train_samples, class_names, config)
    
    if getattr(config, "UNDERSAMPLE_MAJORITY", False):
        import random
        from collections import Counter
        majority_label = class_names.index(config.MAJORITY_CLASS)
        majority_samples = [s for s in train_samples if s.label == majority_label]
        minority_samples = [s for s in train_samples if s.label != majority_label]
        
        minority_counts = Counter([s.label for s in minority_samples])
        target_size = max(minority_counts.values()) if minority_counts else len(majority_samples)
        
        if len(majority_samples) > target_size:
            random.seed(config.SEED)
            majority_samples = random.sample(majority_samples, target_size)
            print(f"Undersampled {config.MAJORITY_CLASS} to {target_size}")
            
        train_samples = minority_samples + majority_samples

    train_labels = np.array([sample.label for sample in train_samples])
    present_classes = np.unique(train_labels)
    present_weights = compute_class_weight(
        class_weight="balanced",
        classes=present_classes,
        y=train_labels,
    )
    class_weights = np.ones(len(class_names), dtype=np.float32)
    for class_idx, weight in zip(present_classes, present_weights):
        class_weights[class_idx] = weight

    train_dataset = RespiratoryCycleDataset(train_samples, config=config, training=True)
    val_dataset = RespiratoryCycleDataset(val_samples, config=config, training=False)
    class_weights = torch.tensor(class_weights, dtype=torch.float32)
    return train_dataset, val_dataset, class_names, class_weights
