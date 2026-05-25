export async function requestMicAccess(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Microphone access requires a secure connection (HTTPS). ' +
      'Please access this app via HTTPS or localhost.'
    );
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export function createMediaRecorder(stream: MediaStream): MediaRecorder {
  return new MediaRecorder(stream);
}

export function startAudioAnalysis(stream: MediaStream, onDecibel: (db: number) => void) {
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  return setInterval(() => {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    onDecibel(Math.round((avg / 255) * 100));
  }, 100);
}

export function recordChunks(recorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve) => {
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
    recorder.start();
  });
}
