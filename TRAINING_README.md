# AcuSound Training Guide

This project trains an EfficientNetB0 classifier on the ICBHI Respiratory Sound Database using annotated respiratory cycles.

The trainer does not treat a full `.wav` recording as one sample. For every recording it reads the matching `.txt` file, extracts each `start_time` to `end_time` breathing cycle, converts that cycle into a log-mel spectrogram, and assigns the patient's disease label from `patient_diagnosis.csv`.

## Dataset Layout

The default config expects your current local layout:

```text
data/
  Respiratory_Sound_Database/
    Respiratory_Sound_Database/
      patient_diagnosis.csv
      audio_and_txt_files/
        101_1b1_Al_sc_Meditron.wav
        101_1b1_Al_sc_Meditron.txt
        ...
```

## Install Training Dependencies

```powershell
python -m pip install --upgrade torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
python -m pip install timm librosa numpy pandas scikit-learn tqdm
```

CPU-only fallback:

```powershell
python -m pip install --upgrade torch torchvision torchaudio
```

## Run Training

From the project root:

```powershell
cd "C:\Users\Yashas H D\Desktop\PYTHON\IDP"
python train.py --device cuda --epochs 30 --batch-size 8
```

CPU fallback:

```powershell
python train.py --device cpu --epochs 30 --batch-size 16
```

Explicit dataset path:

```powershell
python train.py --dataset-root "C:\Users\Yashas H D\Desktop\PYTHON\IDP\data\Respiratory_Sound_Database\Respiratory_Sound_Database" --device cuda --epochs 30 --batch-size 8
```

Train with extra minority-class augmentation:

```powershell
python train.py --device cuda --epochs 30 --batch-size 8 --minority-augmentations noise,time_shift,pitch_shift,time_stretch
```

Quick smoke test:

```powershell
python train.py --max-cycles 32 --epochs 1 --batch-size 4 --device cuda --no-pretrained --checkpoint-dir checkpoints\smoke --output-model checkpoints\smoke\smoke_model.pth
```

## Outputs

Training writes:

```text
checkpoints/best_model_epoch_<N>.pth   Full checkpoint with metadata
acusound_final_model.pth               Raw model weights used by main.py
acusound_final_model.classes.txt       Class labels in model output order
logs/training.log                      Training logs
```

The default class order matches `main.py`:

```text
Asthma
Bronchiectasis
Bronchiolitis
COPD
Healthy
LRTI
Pneumonia
URTI
```

## Useful Options

```powershell
python train.py --help
```

Common options:

- `--epochs`: number of training epochs.
- `--batch-size`: training batch size.
- `--learning-rate`: optimizer learning rate.
- `--device`: `cpu` or `cuda`.
- `--num-workers`: DataLoader workers. Keep `0` on Windows if multiprocessing causes trouble.
- `--max-cycles`: limit samples for a quick test.
- `--no-pretrained`: train without downloading ImageNet pretrained weights.
- `--classes`: comma-separated subset of disease classes.
- `--minority-classes`: comma-separated classes that should receive extra training-only augmented samples.
- `--minority-augmentations`: comma-separated raw-audio transforms. Valid values: `noise`, `time_shift`, `pitch_shift`, `time_stretch`.

## Validation Split

The trainer splits by patient ID, not by respiratory cycle. This avoids data leakage where cycles from the same patient appear in both training and validation. Rare classes with only one patient are kept in training because they cannot be honestly represented in both splits.

## Augmentation

The default augmentation policy matches the minority-class strategy:

```text
Classes: Asthma, Bronchiolitis, Bronchiectasis, Healthy
Transforms: noise, time_shift
```

Augmentation happens only after the patient-wise train/validation split. Validation cycles are never augmented. For augmented training samples, the trainer reloads the raw cycle audio, applies the selected transform, and recomputes the log-mel spectrogram from that augmented audio.
