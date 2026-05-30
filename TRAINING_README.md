# AcuSound Model Training Guide

Production-ready training pipeline for respiratory sound classification using EfficientNetB0.

## Project Structure

```
├── config.py              # Training configuration
├── data_handler.py        # Data loading and preprocessing
├── trainer.py             # Model training and evaluation
├── train.py              # Main training script
├── inference.py          # Inference script
├── checkpoints/          # Saved model checkpoints (created at runtime)
├── logs/                 # Training logs (created at runtime)
└── training.log          # Training log file (created at runtime)
```

## Installation

### Prerequisites
- Python 3.8+
- CUDA 11.0+ (for GPU training)

### Dependencies
```bash
pip install torch torchvision torchaudio
pip install timm librosa audiomentations
pip install numpy pandas scikit-learn
pip install tqdm
```

Or install all at once:
```bash
pip install torch timm librosa audiomentations numpy pandas scikit-learn tqdm
```

## Configuration

Edit `config.py` to customize:

- **Data paths**: `BASE_DIR`, `AUDIO_DIR`, `DIAG_CSV`
- **Hyperparameters**: `EPOCHS`, `BATCH_SIZE`, `LEARNING_RATE`
- **Audio processing**: `SAMPLE_RATE`, `N_MELS`, `SEGMENT_SECONDS`
- **Model**: `MODEL_NAME`, `PRETRAINED`
- **Device**: `DEVICE` (cuda/cpu)

## Training

### Basic Usage
```bash
python train.py
```

### Advanced Options
```bash
# Custom epochs and batch size
python train.py --epochs 50 --batch-size 32

# Use CPU instead of CUDA
python train.py --device cpu

# Custom learning rate
python train.py --learning-rate 0.0005
```

### Command Line Arguments
- `--epochs`: Number of training epochs (default: 30)
- `--batch-size`: Batch size (default: 16)
- `--learning-rate`: Learning rate (default: 1e-4)
- `--device`: Device to use - cuda or cpu (default: cuda)

## Training Features

- **Early Stopping**: Stops training if validation loss doesn't improve for N epochs
- **Class Weighting**: Handles imbalanced classes with weighted loss
- **Automatic Checkpointing**: Saves best model during training
- **Comprehensive Logging**: Detailed logs to file and console
- **Data Augmentation**: Audio and spectrogram augmentation
- **Silence Removal**: Preprocessing to remove silence from audio

## Output

After training:
- `checkpoints/best_model_epoch_X.pth`: Best model checkpoint
- `checkpoints/acusound_final_model.pth`: Final trained model
- `training.log`: Complete training log

## Inference

### Basic Usage
```bash
python inference.py path/to/audio.wav
```

### Advanced Options
```bash
# Custom model path
python inference.py audio.wav --model checkpoints/my_model.pth

# Use CPU for inference
python inference.py audio.wav --device cpu
```

## Data Format

The script expects:
- **Audio**: WAV files in ICBHI format
- **Labels**: CSV file with columns: `patient_id`, `diagnosis`

Directory structure:
```
ICBHI_ROOT/
├── audio_and_txt_files/
│   ├── patient_001_0001.wav
│   ├── patient_002_0001.wav
│   └── ...
└── patient_diagnosis.csv
```

## Data Processing Pipeline

1. **Load Audio**: Load WAV files at 16kHz
2. **Remove Silence**: Remove segments below threshold
3. **Segment**: Split into 5-second segments
4. **Augment**: Apply audio augmentation (pitch shift, time stretch, noise)
5. **Convert**: Extract log-mel spectrograms (224 bins)
6. **Enhance**: Apply SpecAugment (frequency/time masking)
7. **Normalize**: Normalize spectrograms to float32

## Model Architecture

- **Base**: EfficientNetB0 (pretrained ImageNet)
- **Input**: Log-mel spectrograms (3-channel, 224×?)
- **Output**: Class probabilities

## Performance Optimization

- **GPU Memory**: Adjust `BATCH_SIZE` if OOM
- **Training Speed**: Use more workers in DataLoader
- **Better Results**: 
  - Increase `EPOCHS`
  - Adjust learning rate
  - Experiment with augmentation parameters
  - Use data balancing

## Troubleshooting

### CUDA Out of Memory
- Reduce `BATCH_SIZE` in config
- Use `--device cpu` for testing

### Data Not Found
- Verify paths in `config.py`
- Check `AUDIO_DIR` and `DIAG_CSV` exist

### Poor Results
- Verify data quality and format
- Check class distribution (use `Counter(y)` in notebook)
- Increase training epochs
- Adjust augmentation strength

## File Descriptions

### config.py
Central configuration file with all training parameters.

### data_handler.py
- `load_data()`: Load and preprocess entire dataset
- `RespiratoryDataset`: PyTorch dataset class
- Audio processing: silence removal, segmentation, augmentation
- Spectrogram conversion: mel-spectrogram extraction

### trainer.py
- `ModelTrainer`: Main training class
- `train_epoch()`: Single epoch training loop
- `evaluate()`: Validation/test evaluation
- Checkpoint management
- Classification metrics

### train.py
Entry point for training. Handles:
- Argument parsing
- Seed setting
- Data loading
- Model initialization
- Training loop execution

### inference.py
Prediction on new audio files with trained model.

## Example Workflow

```python
# 1. Update config.py with your data paths

# 2. Run training
python train.py --epochs 30

# 3. Check logs
tail -f training.log

# 4. Run inference on new audio
python inference.py new_audio.wav

# 5. Load and use model in your app
import torch
from trainer import ModelTrainer
from config import Config

trainer = ModelTrainer(Config)
trainer.load_checkpoint("checkpoints/acusound_final_model.pth")
# Use trainer.model for inference
```

## License

This project is part of the AcuSound respiratory sound classification research.
