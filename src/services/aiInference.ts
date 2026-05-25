import * as tf from '@tensorflow/tfjs';

let model: tf.GraphModel | null = null;

export async function loadModel(url = '/assets/models/model.json') {
  model = await tf.loadGraphModel(url);
}

export async function classifyAudio(audioBlob: Blob): Promise<{ prediction: string; confidence: number }> {
  if (!model) throw new Error('Model not loaded');

  const audioCtx = new AudioContext();
  const arrayBuf = await audioBlob.arrayBuffer();
  const audioBuf = await audioCtx.decodeAudioData(arrayBuf);

  const rawData = audioBuf.getChannelData(0);
  const downsampled = downsample(rawData, audioBuf.sampleRate, 16000);
  const mfcc = extractMFCC(downsampled, 16000);

  const flat = mfcc.flat();
  const input = tf.tensor3d(flat, [1, mfcc.length, mfcc[0].length]);
  const output = model.predict(input) as tf.Tensor;
  const probs = await output.data();
  const idx = Array.from(probs).indexOf(Math.max(...Array.from(probs)));

  const classes = ['Healthy', 'Asthma', 'Pneumonia', 'COPD'];
  return { prediction: classes[idx], confidence: probs[idx] };
}

function downsample(buffer: Float32Array, srcRate: number, dstRate: number): Float32Array {
  if (srcRate === dstRate) return buffer;
  const ratio = srcRate / dstRate;
  const len = Math.round(buffer.length / ratio);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = buffer[Math.round(i * ratio)];
  return out;
}

function extractMFCC(signal: Float32Array, sampleRate: number): number[][] {
  const frameSize = 512;
  const hopSize = 256;
  const frames: number[][] = [];

  for (let start = 0; start + frameSize <= signal.length; start += hopSize) {
    const frame = signal.slice(start, start + frameSize);
    const windowed = frame.map((s, i) => s * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frameSize - 1))));
    const spectrum = rfft(windowed);

    const melBands = 13;
    const melFilters = melFilterbank(spectrum.length, sampleRate, melBands);
    const melEnergies = melFilters.map((filter) => filter.reduce((sum, w, j) => sum + w * spectrum[j], 0));
    const logMel = melEnergies.map((e) => Math.log(Math.max(e, 1e-10)));
    const dct = dctTransform(logMel);
    frames.push(dct);
  }
  return frames;
}

function rfft(signal: Float32Array): number[] {
  const N = signal.length;
  const out: number[] = new Array(N / 2 + 1).fill(0);
  for (let k = 0; k <= N / 2; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(phi);
      im -= signal[n] * Math.sin(phi);
    }
    out[k] = Math.sqrt(re * re + im * im);
  }
  return out;
}

function melFilterbank(nFft: number, sampleRate: number, nMels: number): number[][] {
  const lowFreq = 0;
  const highFreq = sampleRate / 2;
  const lowMel = 2595 * Math.log10(1 + lowFreq / 700);
  const highMel = 2595 * Math.log10(1 + highFreq / 700);
  const melPoints = Array.from({ length: nMels + 2 }, (_, i) => lowMel + (highMel - lowMel) * i / (nMels + 1));
  const freqPoints = melPoints.map((m) => 700 * (Math.pow(10, m / 2595) - 1));
  const binPoints = freqPoints.map((f) => Math.floor((nFft + 1) * f / sampleRate));

  const filters: number[][] = [];
  for (let i = 0; i < nMels; i++) {
    const filter = new Array(nFft).fill(0);
    const start = binPoints[i];
    const center = binPoints[i + 1];
    const end = binPoints[i + 2];
    for (let j = start; j < center; j++) filter[j] = (j - start) / (center - start);
    for (let j = center; j < end; j++) filter[j] = (end - j) / (end - center);
    filters.push(filter);
  }
  return filters;
}

function dctTransform(logMel: number[]): number[] {
  const N = logMel.length;
  const coefs: number[] = [];
  for (let k = 0; k < 13; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += logMel[n] * Math.cos((Math.PI * k * (n + 0.5)) / N);
    }
    coefs.push(sum);
  }
  return coefs;
}
