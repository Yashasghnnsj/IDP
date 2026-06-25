"""
Convert PyTorch EfficientNetB0 model (.pth) -> self-contained ONNX file

Usage:
    python convert_model.py

Output:
    public/assets/models/model.onnx (single file, ~16MB, for onnxruntime-web)
"""
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ModelConverter")

MODEL_PATH = "acusound_final_model.pth"
OUTPUT_DIR = "public/assets/models"


def main():
    import torch
    import timm

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    onnx_path = os.path.join(OUTPUT_DIR, "model.onnx")

    logger.info(f"Loading model weights from {MODEL_PATH}...")

    # Read class count dynamically from the classes file
    classes_txt = MODEL_PATH.replace(".pth", ".classes.txt")
    if os.path.exists(classes_txt):
        with open(classes_txt) as f:
            class_names = [line.strip() for line in f if line.strip()]
        num_classes = len(class_names)
        logger.info(f"Detected {num_classes} classes from {classes_txt}: {class_names}")
    else:
        num_classes = 4  # default for current 4-class model
        logger.warning(f"Classes file not found at {classes_txt}, defaulting to {num_classes} classes")

    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=num_classes)
    state = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    model.load_state_dict(state)
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224)

    logger.info("Exporting to ONNX (legacy exporter, opset 12)...")

    # Force legacy TorchScript-based exporter to avoid torch 2.x dynamo issues
    import torch.onnx
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        dynamo=False,
    )

    # Reload and save as a single self-contained file (embed weights inline)
    logger.info("Converting to self-contained ONNX (embedding weights inline)...")
    import onnx

    onnx_model = onnx.load(onnx_path)
    # Remove the old file (including any external data files)
    data_file = onnx_path + ".data"
    if os.path.exists(data_file):
        os.remove(data_file)
    os.remove(onnx_path)

    # Save with weights embedded inline
    onnx.save_model(
        onnx_model,
        onnx_path,
        save_as_external_data=False,
    )

    size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    logger.info(f"Self-contained ONNX model saved to {onnx_path} ({size_mb:.2f} MB)")
    logger.info("Conversion complete. The model is ready for onnxruntime-web.")


if __name__ == "__main__":
    main()
