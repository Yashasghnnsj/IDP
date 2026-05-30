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
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=8)
    state = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    model.load_state_dict(state)
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224)

    logger.info("Exporting to ONNX...")

    # Export with torch.onnx.export
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        opset_version=17,
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
