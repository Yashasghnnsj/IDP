"""
Test training script with synthetic data for verification

This allows you to verify the training pipeline works before using real data.
"""
import torch
import numpy as np
from pathlib import Path
from torch.utils.data import DataLoader

from config import Config
from data_handler import RespiratoryDataset
from trainer import ModelTrainer
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_synthetic_data(num_samples=100, num_classes=4, spec_shape=(224, 256)):
    """Create synthetic spectrogram data for testing"""
    logger.info(f"Creating {num_samples} synthetic samples for testing...")
    
    X = np.random.randn(num_samples, spec_shape[0], spec_shape[1], 3).astype(np.float32)
    y = np.random.randint(0, num_classes, num_samples)
    
    # Create class weights
    from sklearn.utils.class_weight import compute_class_weight
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(y),
        y=y
    )
    class_weights = torch.tensor(class_weights, dtype=torch.float32)
    
    return X, y, class_weights, ["Asthma", "Bronchitis", "Bronchiectasis", "Pneumonia"]


def main():
    """Train with synthetic data"""
    
    logger.info("="*60)
    logger.info("AcuSound Training - Synthetic Data Test")
    logger.info("="*60)
    
    # Create synthetic data
    X, y, class_weights, class_names = create_synthetic_data(num_samples=200, num_classes=4)
    
    # Split data
    split_idx = int(0.8 * len(X))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    logger.info(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    logger.info(f"Classes: {class_names}")
    
    # Create datasets and dataloaders
    train_dataset = RespiratoryDataset(X_train, y_train)
    test_dataset = RespiratoryDataset(X_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=Config.BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=Config.BATCH_SIZE, shuffle=False)
    
    # Initialize trainer
    logger.info("\nInitializing model...")
    trainer = ModelTrainer(Config)
    trainer.build_model(num_classes=len(class_names), class_weights=class_weights)
    
    # Train for just a few epochs to test
    logger.info("\nStarting test training (3 epochs)...")
    trainer.train(train_loader, test_loader, num_epochs=3)
    
    # Evaluate
    logger.info("\n" + "="*60)
    logger.info("Test Complete!")
    logger.info("="*60)
    logger.info("\nIf this ran successfully, your training pipeline is working.")
    logger.info("Now update config.py with your actual ICBHI dataset path and run:")
    logger.info("  python train.py --epochs 50 --batch-size 32")


if __name__ == "__main__":
    main()
