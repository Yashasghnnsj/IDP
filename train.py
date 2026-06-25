"""Train the AcuSound EfficientNet model on ICBHI respiratory cycles."""
import argparse
import logging
import random
from pathlib import Path

import numpy as np
import torch

from config import Config
from data_handler import load_data
from trainer import ModelTrainer


def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def configure_logging(log_dir):
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    handlers = [
        logging.StreamHandler(),
        logging.FileHandler(Path(log_dir) / "training.log", mode="w", encoding="utf-8"),
    ]
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=handlers,
    )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Train AcuSound on annotated ICBHI respiratory cycles."
    )
    parser.add_argument(
        "--dataset-root",
        type=Path,
        default=Config.ICBHI_ROOT,
        help="Folder containing patient_diagnosis.csv and audio_and_txt_files.",
    )
    parser.add_argument("--epochs", type=int, default=Config.EPOCHS)
    parser.add_argument("--batch-size", type=int, default=Config.BATCH_SIZE)
    parser.add_argument("--learning-rate", type=float, default=Config.LEARNING_RATE)
    parser.add_argument("--device", choices=["cuda", "cpu"], default=Config.DEVICE)
    parser.add_argument("--num-workers", type=int, default=Config.NUM_WORKERS)
    parser.add_argument("--val-size", type=float, default=Config.VAL_SIZE)
    parser.add_argument("--max-cycles", type=int, default=None, help="Optional smoke-test limit.")
    parser.add_argument(
        "--no-pretrained",
        action="store_true",
        help="Disable ImageNet pretrained weights.",
    )
    parser.add_argument(
        "--classes",
        type=str,
        default=",".join(Config.CLASS_NAMES),
        help="Comma-separated disease classes to train.",
    )
    parser.add_argument(
        "--minority-classes",
        type=str,
        default=",".join(Config.MINORITY_AUGMENT_CLASSES),
        help="Comma-separated classes to augment in the training set only.",
    )
    parser.add_argument(
        "--minority-augmentations",
        type=str,
        default=",".join(Config.MINORITY_AUGMENTATIONS),
        help="Comma-separated raw-audio augmentations: noise,time_shift,pitch_shift,time_stretch.",
    )
    parser.add_argument(
        "--output-model",
        type=Path,
        default=Path("acusound_final_model.pth"),
        help="Raw state_dict output path used by main.py.",
    )
    parser.add_argument(
        "--checkpoint-dir",
        type=Path,
        default=Config.CHECKPOINT_DIR,
        help="Directory for full training checkpoints.",
    )
    return parser.parse_args()


def build_config(args):
    config = Config()
    config.ICBHI_ROOT = args.dataset_root
    config.AUDIO_DIR = args.dataset_root / "audio_and_txt_files"
    config.DIAG_CSV = args.dataset_root / "patient_diagnosis.csv"
    config.EPOCHS = args.epochs
    config.BATCH_SIZE = args.batch_size
    config.LEARNING_RATE = args.learning_rate
    config.DEVICE = args.device
    config.NUM_WORKERS = args.num_workers
    config.VAL_SIZE = args.val_size
    config.MAX_CYCLES = args.max_cycles
    config.PRETRAINED = not args.no_pretrained
    config.CLASS_NAMES = [item.strip() for item in args.classes.split(",") if item.strip()]
    config.MINORITY_AUGMENT_CLASSES = [
        item.strip() for item in args.minority_classes.split(",") if item.strip()
    ]
    config.MINORITY_AUGMENTATIONS = [
        item.strip() for item in args.minority_augmentations.split(",") if item.strip()
    ]
    config.CHECKPOINT_DIR = args.checkpoint_dir
    return config


def main():
    args = parse_args()
    config = build_config(args)
    configure_logging(config.LOG_DIR)

    if config.DEVICE == "cuda" and not torch.cuda.is_available():
        logging.warning("CUDA requested but unavailable; falling back to CPU.")
        config.DEVICE = "cpu"

    set_seed(config.SEED)

    logging.info("Dataset root: %s", config.ICBHI_ROOT)
    logging.info("Audio folder: %s", config.AUDIO_DIR)
    logging.info("Diagnosis CSV: %s", config.DIAG_CSV)
    logging.info("Device: %s", config.DEVICE)
    logging.info("Classes: %s", ", ".join(config.CLASS_NAMES))
    logging.info("Minority augmentation classes: %s", ", ".join(config.MINORITY_AUGMENT_CLASSES))
    logging.info("Minority augmentations: %s", ", ".join(config.MINORITY_AUGMENTATIONS))

    train_dataset, val_dataset, class_names, class_weights = load_data(config)
    logging.info("Training cycles: %s", len(train_dataset))
    logging.info("Validation cycles: %s", len(val_dataset))
    logging.info("Resolved classes: %s", ", ".join(class_names))

    trainer = ModelTrainer(
        config,
        class_names=class_names,
        class_weights=class_weights,
    )
    best_checkpoint = trainer.train(train_dataset, val_dataset)
    final_model = trainer.export_state_dict(args.output_model)

    logging.info("Best checkpoint: %s", best_checkpoint)
    logging.info("Final model weights saved to: %s", final_model)
    logging.info("Class labels saved to: %s", final_model.with_suffix(".classes.txt"))


if __name__ == "__main__":
    main()
