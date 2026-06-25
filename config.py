"""AcuSound model training configuration."""
from pathlib import Path

class Config:
    """Training configuration."""

    # Local ICBHI layout:
    # data/
    #   Respiratory_Sound_Database/
    #     Respiratory_Sound_Database/
    #       patient_diagnosis.csv
    #       audio_and_txt_files/
    BASE_DIR = Path("./data")
    ICBHI_ROOT = BASE_DIR / "Respiratory_Sound_Database" / "Respiratory_Sound_Database"
    AUDIO_DIR = ICBHI_ROOT / "audio_and_txt_files"
    DIAG_CSV = ICBHI_ROOT / "patient_diagnosis.csv"
    
    # Output paths
    CHECKPOINT_DIR = Path("./checkpoints")
    LOG_DIR = Path("./logs")
    
    # Training hyperparameters
    SEED = 42
    DEVICE = "cuda"
    BATCH_SIZE = 16
    LEARNING_RATE = 1e-4
    EPOCHS = 30
    EARLY_STOPPING_PATIENCE = 5
    NUM_WORKERS = 0
    
    # Audio processing
    SAMPLE_RATE = 16000
    SEGMENT_SECONDS = 5
    MIN_CYCLE_SECONDS = 0.5
    N_MELS = 224
    TOP_DB = 20  # for silence removal
    
    # Data augmentation
    AUGMENTATION = {
        "gaussian_noise": {"min_amplitude": 0.001, "max_amplitude": 0.015, "p": 0.5},
        "pitch_shift": {"min_semitones": -2, "max_semitones": 2, "p": 0.5},
        "time_stretch": {"min_rate": 0.8, "max_rate": 1.25, "p": 0.5},
        "freq_mask": {"min_range": 5, "max_range": 20},
        "time_mask": {"min_range": 5, "max_range": 20},
    }
    SPEC_AUGMENT = True
    SPEC_TIME_MASK_PARAM = 10
    SPEC_FREQ_MASK_PARAM = 8
    
    MINORITY_AUGMENT_CLASSES = [
        "Bronchiolitis",
        "Bronchiectasis",
        "Healthy",
    ]
    MINORITY_AUGMENTATIONS = [
        "noise",
        "time_shift",
        "pitch_shift",
        "time_stretch"
    ]
    TIME_SHIFT_MAX_RATIO = 0.1
    AUG_MULTIPLIER = 3
    UNDERSAMPLE_MAJORITY = True
    MAJORITY_CLASS = "COPD"
    
    # Model
    MODEL_NAME = "efficientnet_b0"
    PRETRAINED = True
    CLASS_NAMES = [
        "Bronchiectasis",
        "Bronchiolitis",
        "COPD",
        "Healthy",
    ]
    
    # Data split
    TEST_SIZE = 0.2
    VAL_SIZE = 0.2
    MAX_CYCLES = None
    
    # Logging
    LOG_INTERVAL = 10
    VERBOSE = True
