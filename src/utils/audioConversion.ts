export async function webmToWav(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();

      const pcm = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      const wav = encodeWav(pcm, sampleRate);
      return new Blob([wav], { type: 'audio/wav' });
    } catch (decodeError) {
      audioCtx.close();
      console.error('Failed to decode audio data:', decodeError);
      throw new Error('Failed to convert audio format. Please ensure audio was recorded properly.');
    }
  } catch (error) {
    console.error('Error in webmToWav:', error);
    throw new Error(`Audio conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const channels = 1;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  const writeU16 = (offset: number, v: number) => view.setUint16(offset, v, true);
  const writeU32 = (offset: number, v: number) => view.setUint32(offset, v, true);

  writeStr(0, 'RIFF');
  writeU32(4, 36 + dataLength);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  writeU32(16, 16);
  writeU16(20, 1);
  writeU16(22, channels);
  writeU32(24, sampleRate);
  writeU32(28, sampleRate * channels * bytesPerSample);
  writeU16(32, channels * bytesPerSample);
  writeU16(34, bytesPerSample * 8);
  writeStr(36, 'data');
  writeU32(40, dataLength);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}
