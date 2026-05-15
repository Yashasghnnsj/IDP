import { Audio } from 'expo-av';

let recording: Audio.Recording | null = null;

export async function requestAudioPermission() {
  const { status } = await Audio.requestPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Audio permission not granted');
  }
}

export async function startRecording(
  onDecibelUpdate?: (db: number) => void,
  onDurationUpdate?: (duration: number) => void
) {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  recording = new Audio.Recording();

  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  recording.setOnRecordingStatusUpdate((status) => {
    if (status.isRecording && status.metering !== undefined) {
      const decibel = Math.min(
        100,
        Math.max(0, (status.metering + 160) * (100 / 160))
      );

      onDecibelUpdate?.(decibel);
      onDurationUpdate?.(status.durationMillis);
    }
  });

  await recording.startAsync();
}

export async function stopRecording(): Promise<string> {
  if (!recording) return '';

  await recording.stopAndUnloadAsync();

  const uri = recording.getURI() || '';

  recording = null;

  return uri;
}

export function isRecordingActive(): boolean {
  return recording !== null;
}