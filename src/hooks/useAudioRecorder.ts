import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [decibel, setDecibel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      // Check for secure context (HTTPS or localhost) — required for microphone on mobile
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Microphone access requires a secure connection (HTTPS). ' +
          'Please access this app via HTTPS or localhost.'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      intervalRef.current = window.setInterval(() => {
        if (recorder.state !== 'recording') return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setDecibel(Math.round((avg / 255) * 100));
        setDuration(Date.now() - startTimeRef.current);
      }, 100);
    } catch (err: any) {
      const message = err?.message || 'Failed to access microphone';
      setError(message);
      console.error('Audio recording error:', err);
    }
  }, []);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      clearInterval(intervalRef.current);
      const recorder = mediaRecorderRef.current;
      if (!recorder) return;
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setDecibel(0);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return { isRecording, decibel, duration, start, stop, error };
}
