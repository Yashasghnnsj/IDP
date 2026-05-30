"""
AcuSound Model Training Configuration
"""
from pathlib import Path

class Config:
    """Training configuration"""
    
    # Paths - Update these to your actual data location
    # Example Windows paths:
    # ICBHI_ROOT = Path("D:/Datasets/ICBHI/Respiratory_Sound_Database")
    # ICBHI_ROOT = Path("C:/Users/YourName/Downloads/ICBHI")
    
    BASE_DIR = Path("./data")  # Change this to your dataset location
    ICBHI_ROOT = BASE_DIR / "ICBHI_datasets" / "Respiratory_Sound_Database"
    AUDIO_DIR = ICBHI_ROOT / "audio_and_txt_files"
    DIAG_CSV = ICBHI_ROOT / "patient_diagnosis.csv"
    
    # Output paths
    CHECKPOINT_DIR = Path("./checkpoints")
    LOG_DIR = Path("./logs")
    
    # Training hyperparameters
    SEED = 42
    DEVICE = "cpu"  # Change to "cuda" if you have CUDA-enabled PyTorch
    BATCH_SIZE = 16
    LEARNING_RATE = 1e-4
    EPOCHS = 30
    EARLY_STOPPING_PATIENCE = 5
    
    # Audio processing
    SAMPLE_RATE = 16000
    SEGMENT_SECONDS = 5
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
    
    # Model
    MODEL_NAME = "efficientnet_b0"
    PRETRAINED = True
    
    # Data split
    TEST_SIZE = 0.2
    MAX_SEGMENTS_PER_AUDIO = 3
    
    # Logging
    LOG_INTERVAL = 10
    VERBOSE = True
