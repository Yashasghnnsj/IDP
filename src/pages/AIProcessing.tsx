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

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortFromExternalSignal = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const { signal: _signal, ...fetchOptions } = options;
  let raceTimeoutId = 0;

  try {
    const request = fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    const timeout = new Promise<never>((_, reject) => {
      raceTimeoutId = window.setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    });
    return await Promise.race([request, timeout]);
  } finally {
    controller.abort();
    window.clearTimeout(timeoutId);
    window.clearTimeout(raceTimeoutId);
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
        setDebugInfo(IS_NATIVE_APP && !API_BASE_URL ? 'Preparing on-device analysis...' : 'Checking for AI server...');

        let serverReachable = false;
        if (!IS_NATIVE_APP || API_BASE_URL) {
          // Try health check up to 2 times — first request through Vite HTTPS proxy
          // can be slow on first load. 8s timeout per attempt.
          for (let attempt = 0; attempt < 2 && !serverReachable; attempt++) {
            try {
              const healthResp = await fetchWithTimeout(apiUrl('/api/health'), {
                method: 'GET',
                headers: { Accept: 'application/json' },
              }, 8000);
              if (healthResp.ok && isJsonResponse(healthResp)) {
                const healthData = await healthResp.json();
                serverReachable = healthData?.status === 'healthy';
              } else {
                console.warn(`[AcuSound] Health check attempt ${attempt + 1}: HTTP ${healthResp.status}`);
              }
            } catch (err) {
              console.warn(`[AcuSound] Health check attempt ${attempt + 1} failed:`, err);
            }
          }
          console.info(`[AcuSound] Server reachable: ${serverReachable}`);
        }

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
    setDebugInfo('Uploading audio to server...');

    const formData = new FormData();
    formData.append('audio', wavBlob, 'recording.wav');

    setDebugInfo('Waiting for AI analysis...');
    const response = await fetchWithTimeout(apiUrl('/api/analyze'), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
      signal,
    }, 60000);

    if (!isJsonResponse(response)) {
      const preview = await response.text().catch(() => '');
      const trimmedPreview = preview.trim().slice(0, 80);
      throw new Error(
        trimmedPreview.startsWith('<!DOCTYPE') || trimmedPreview.startsWith('<html')
          ? 'AI server endpoint returned the app page instead of JSON. Check the API server URL.'
          : 'AI server returned a non-JSON response.'
      );
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.detail || `Server error: ${response.status}`);
    }

    return response.json();
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
        {mode === 'local' ? 'On-device neural network processing' : 'AI neural network processing audio patterns'}
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
