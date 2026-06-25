import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import lottie from 'lottie-web';
import { Capacitor } from '@capacitor/core';
import animationData from '../assets/animations/ai-brain.json';
import { useHealthStore } from '../store/healthStore';
import type { AnalyzeResponse } from '../types/diagnosis';
import { webmToWav } from '../utils/audioConversion';
import {
  loadONNXModel,
  isModelLoaded,
  classifyAudio as onnxClassify,
  classifyAudioLightweight,
} from '../services/aiInference';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const IS_NATIVE_APP = Capacitor.isNativePlatform();

const SERVER_URLS = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  API_BASE_URL,
  'http://192.168.0.107:8000',
  'http://10.0.2.2:8000',
].filter(Boolean);

// Deduplicate while preserving order
const uniqueUrls = [...new Set(SERVER_URLS)];

let resolvedBaseUrl = uniqueUrls[0] || API_BASE_URL;

function apiUrl(path: string) {
  return `${resolvedBaseUrl}${path}`;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortFromExternalSignal = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const { signal: _signal, ...fetchOptions } = options;

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortFromExternalSignal);
  }
}

function isJsonResponse(response: Response) {
  return response.headers.get('content-type')?.toLowerCase().includes('application/json') ?? false;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

export default function AIProcessing() {
  const nav = useNavigate();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Starting analysis...');
  const [mode, setMode] = useState<'server' | 'local' | 'checking'>('checking');
  const audioBlob = useHealthStore((s) => s.audioBlob);
  const selectedModel = useHealthStore((s) => s.selectedModel);
  const setCurrentResult = useHealthStore((s) => s.setCurrentResult);
  const addResult = useHealthStore((s) => s.addResult);

  useEffect(() => {
    const container = document.getElementById('lottie-brain');
    if (!container) return;
    const anim = lottie.loadAnimation({
      container,
      animationData,
      renderer: 'svg',
      loop: true,
      autoplay: true,
    });
    return () => anim.destroy();
  }, []);

  useEffect(() => {
    if (!audioBlob) {
      setError('No audio recording found. Please go back and record first.');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setError(null);
    setProgress(0);
    setMode('checking');

    const runAnalysis = async () => {
      try {
        setDebugInfo('Searching for AI server...');

        let serverReachable = false;
        for (const baseUrl of uniqueUrls) {
          if (serverReachable) break;
          for (let attempt = 0; attempt < 2 && !serverReachable; attempt++) {
            const hc = new AbortController();
            const hcTimeout = window.setTimeout(() => hc.abort(), 4000);
            try {
              console.info(`[AcuSound] Health check ${baseUrl} attempt ${attempt + 1}...`);
              const healthResp = await fetch(`${baseUrl}/api/health`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: hc.signal,
              });
              window.clearTimeout(hcTimeout);
              if (healthResp.ok) {
                const contentType = healthResp.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                  const healthData = await healthResp.json();
                  if (healthData?.status === 'healthy') {
                    serverReachable = true;
                    resolvedBaseUrl = baseUrl;
                    console.info(`[AcuSound] Server found at: ${baseUrl}`);
                  }
                }
              }
            } catch (err) {
              window.clearTimeout(hcTimeout);
            }
          }
        }
        console.info(`[AcuSound] Server reachable: ${serverReachable}, using: ${resolvedBaseUrl}`);

        if (cancelled) return;

        let data: AnalyzeResponse;

        if (serverReachable) {
          setMode('server');
          setDebugInfo('Server detected. Running cloud AI analysis...');
          data = await withTimeout(
            runServerAnalysis(controller.signal),
            65000,
            'AI server took too long to respond. Please check that the backend is running and try again.'
          );
        } else {
          setMode('local');
          setDebugInfo('No server detected. Running on-device AI...');
          data = await withTimeout(
            runLocalAnalysis(),
            45000,
            'On-device analysis took too long. Start the AI server for faster analysis or try a shorter recording.'
          );
        }

        if (cancelled) return;

        setCurrentResult(data);
        addResult({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          disease: data.predicted_class,
          confidence: Math.round(data.confidence * 100),
          risk: data.risk,
          fullReport: data,
        });

        setProgress(100);
        setTimeout(() => nav('/result'), 600);
      } catch (err: any) {
        if (cancelled || err.name === 'AbortError') return;
        console.error('Analysis error:', err);
        setError(err.message || 'Analysis failed. Please try again.');
        setDebugInfo(`Error: ${err.message}`);
      }
    };

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        return p + 1;
      });
    }, 80);

    runAnalysis();

    return () => {
      cancelled = true;
      clearInterval(interval);
      controller.abort();
    };
  }, [audioBlob]);

  async function runServerAnalysis(signal: AbortSignal): Promise<AnalyzeResponse> {
    const wavBlob = await webmToWav(audioBlob!);

    const fallbackModels = ['svm', 'knn', 'rf'].filter((m) => m !== selectedModel);
    const modelsToTry = [selectedModel, ...fallbackModels];

    for (const modelType of modelsToTry) {
      if (signal.aborted) throw new Error('Analysis cancelled');

      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('model_type', modelType);

      setDebugInfo(modelType === selectedModel
        ? `Running ${modelType} analysis...`
        : `${selectedModel} unavailable — trying ${modelType}...`);

      try {
        const response = await fetchWithTimeout(apiUrl('/api/analyze'), {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
          signal,
        }, 60000);

        if (!isJsonResponse(response)) {
          const preview = await response.text().catch(() => '');
          const trimmedPreview = preview.trim().slice(0, 80);
          const msg = trimmedPreview.startsWith('<!DOCTYPE') || trimmedPreview.startsWith('<html')
            ? 'AI server endpoint returned the app page instead of JSON. Check the API server URL.'
            : 'AI server returned a non-JSON response.';
          if (modelType === modelsToTry[modelsToTry.length - 1]) throw new Error(msg);
          console.warn(`[AcuSound] ${modelType} failed: ${msg}, trying next model...`);
          continue;
        }

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          const msg = errBody.detail || `Server error: ${response.status}`;
          if (modelType === modelsToTry[modelsToTry.length - 1]) throw new Error(msg);
          console.warn(`[AcuSound] ${modelType} failed: ${msg}, trying next model...`);
          continue;
        }

        return response.json();
      } catch (err: any) {
        if (modelType === modelsToTry[modelsToTry.length - 1]) throw err;
        console.warn(`[AcuSound] ${modelType} request failed: ${err.message}, trying next model...`);
      }
    }

    throw new Error('All server models failed. Please try again.');
  }

  async function runLocalAnalysis(): Promise<AnalyzeResponse> {
    try {
      setDebugInfo('Loading on-device AI model...');
      await loadONNXModel();
      if (!isModelLoaded()) {
        throw new Error('On-device AI model failed to load');
      }

      setDebugInfo('Processing audio through neural network...');
      return await onnxClassify(audioBlob!);
    } catch (err) {
      console.warn('ONNX analysis failed, using lightweight analyzer:', err);
      setDebugInfo('AI model runtime unavailable. Using fallback analyzer...');
      return classifyAudioLightweight(audioBlob!);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">Analysis Failed</h2>
        <p className="text-gray-500 text-sm text-center mb-2">{error}</p>
        <p className="text-gray-400 text-xs text-center mb-6">{debugInfo}</p>
        <button
          onClick={() => nav('/recording')}
          className="py-3 px-8 rounded-xl bg-blue-600 text-white font-semibold active:scale-95 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div id="lottie-brain" className="w-36 h-36" />
      <h2 className="text-xl font-bold mt-6">Analyzing Your Breath</h2>
      <p className="text-gray-500 text-sm mt-2">
        {mode === 'local' ? 'On-device neural network processing' : `AI processing with ${selectedModel}`}
      </p>
      {mode === 'local' && (
        <span className="mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
          Offline Mode
        </span>
      )}
      <div className="w-48 h-2 bg-gray-200 rounded-full mt-8 overflow-hidden">
        <motion.div className="h-full bg-blue-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm text-gray-400 mt-2">{progress}%</p>
      <p className="text-xs text-gray-300 mt-6 max-w-xs text-center">
        {debugInfo}
      </p>
      <p className="text-xs text-gray-400 mt-2 max-w-xs text-center">
        Extracting respiratory features &bull; Classifying lung sounds &bull; Generating report
      </p>
    </div>
  );
}
