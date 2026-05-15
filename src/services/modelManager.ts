import RNFS from 'react-native-fs'; // or expo-file-system
import { TensorflowLite } from 'react-native-fast-tflite';

const MODEL_PATH = `${RNFS.DocumentDirectoryPath}/model.tflite`;
const MODEL_URL = 'https://your-cdn.com/model.tflite';

export async function ensureModelExists() {
  const exists = await RNFS.exists(MODEL_PATH);
  if (!exists) {
    await RNFS.downloadFile({ fromUrl: MODEL_URL, toFile: MODEL_PATH }).promise;
  }
  return MODEL_PATH;
}

export async function loadModel() {
  const path = await ensureModelExists();
  const interpreter = await TensorflowLite.loadModel({ modelPath: path });
  return interpreter;
}