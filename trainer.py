"""PyTorch training utilities for AcuSound."""
from pathlib import Path
import logging
import shutil

import timm
import torch
from sklearn.metrics import classification_report
from torch import nn
from torch.utils.data import DataLoader
from tqdm import tqdm


class ModelTrainer:
    """Train and evaluate the EfficientNet respiratory classifier."""

    def __init__(self, config, class_names=None, class_weights=None):
        self.config = config
        self.class_names = list(class_names or config.CLASS_NAMES)
        self.device = torch.device(config.DEVICE)
        self.model = timm.create_model(
            config.MODEL_NAME,
            pretrained=config.PRETRAINED,
            num_classes=len(self.class_names),
        ).to(self.device)

        weight = class_weights.to(self.device) if class_weights is not None else None
        self.criterion = nn.CrossEntropyLoss(weight=weight)
        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=config.LEARNING_RATE,
            weight_decay=1e-4,
        )
        self.scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode="min",
            factor=0.5,
            patience=2,
        )

        self.best_val_loss = float("inf")
        self.best_checkpoint_path = None
        Path(config.CHECKPOINT_DIR).mkdir(parents=True, exist_ok=True)

    def make_loader(self, dataset, shuffle):
        return DataLoader(
            dataset,
            batch_size=self.config.BATCH_SIZE,
            shuffle=shuffle,
            num_workers=self.config.NUM_WORKERS,
            pin_memory=self.device.type == "cuda",
        )

    def train_epoch(self, train_loader, epoch):
        self.model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        progress = tqdm(train_loader, desc=f"Epoch {epoch} train", leave=False)
        for batch_idx, (inputs, labels) in enumerate(progress, start=1):
            inputs = inputs.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            self.optimizer.zero_grad(set_to_none=True)
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels)
            loss.backward()
            self.optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            predicted = outputs.argmax(dim=1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)

            progress.set_postfix({
                "loss": f"{running_loss / max(total, 1):.4f}",
                "acc": f"{correct / max(total, 1):.4f}",
            })

        return running_loss / max(total, 1), correct / max(total, 1)

    @torch.no_grad()
    def evaluate(self, val_loader):
        self.model.eval()
        running_loss = 0.0
        correct = 0
        total = 0
        all_labels = []
        all_preds = []

        progress = tqdm(val_loader, desc="Validation", leave=False)
        for inputs, labels in progress:
            inputs = inputs.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels)
            predicted = outputs.argmax(dim=1)

            running_loss += loss.item() * inputs.size(0)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)
            all_labels.extend(labels.cpu().tolist())
            all_preds.extend(predicted.cpu().tolist())

            progress.set_postfix({
                "loss": f"{running_loss / max(total, 1):.4f}",
                "acc": f"{correct / max(total, 1):.4f}",
            })

        report = ""
        if all_labels:
            report = classification_report(
                all_labels,
                all_preds,
                labels=list(range(len(self.class_names))),
                target_names=self.class_names,
                zero_division=0,
            )

        return running_loss / max(total, 1), correct / max(total, 1), report

    def save_checkpoint(self, epoch, val_loss, val_acc, path):
        checkpoint = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "val_loss": val_loss,
            "val_acc": val_acc,
            "class_names": self.class_names,
            "model_name": self.config.MODEL_NAME,
            "sample_rate": self.config.SAMPLE_RATE,
            "segment_seconds": self.config.SEGMENT_SECONDS,
            "n_mels": self.config.N_MELS,
        }
        torch.save(checkpoint, path)

    def train(self, train_dataset, val_dataset):
        train_loader = self.make_loader(train_dataset, shuffle=True)
        val_loader = self.make_loader(val_dataset, shuffle=False) if len(val_dataset) else None

        patience_counter = 0
        for epoch in range(1, self.config.EPOCHS + 1):
            train_loss, train_acc = self.train_epoch(train_loader, epoch)

            if val_loader is None:
                val_loss, val_acc, report = train_loss, train_acc, ""
            else:
                val_loss, val_acc, report = self.evaluate(val_loader)

            self.scheduler.step(val_loss)
            logging.info(
                "Epoch %s/%s - train_loss=%.4f train_acc=%.4f val_loss=%.4f val_acc=%.4f",
                epoch,
                self.config.EPOCHS,
                train_loss,
                train_acc,
                val_loss,
                val_acc,
            )
            if report:
                logging.info("\n%s", report)

            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                patience_counter = 0
                checkpoint_path = Path(self.config.CHECKPOINT_DIR) / f"best_model_epoch_{epoch}.pth"
                self.save_checkpoint(epoch, val_loss, val_acc, checkpoint_path)
                self.best_checkpoint_path = checkpoint_path
                logging.info("Saved new best checkpoint: %s", checkpoint_path)
            else:
                patience_counter += 1

            if patience_counter >= self.config.EARLY_STOPPING_PATIENCE:
                logging.info("Early stopping triggered after %s epochs without improvement.", patience_counter)
                break

        return self.best_checkpoint_path

    def export_state_dict(self, output_path):
        """Save raw weights for compatibility with main.py."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if self.best_checkpoint_path is not None:
            checkpoint = torch.load(self.best_checkpoint_path, map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])

        torch.save(self.model.state_dict(), output_path)

        class_file = output_path.with_suffix(".classes.txt")
        class_file.write_text("\n".join(self.class_names) + "\n", encoding="utf-8")
        return output_path

    def copy_best_checkpoint(self, output_path):
        if self.best_checkpoint_path is None:
            return None

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(self.best_checkpoint_path, output_path)
        return output_path
