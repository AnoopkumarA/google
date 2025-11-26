import { Blob } from '@google/genai';

export function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  if (inputSampleRate < outputSampleRate) {
    return buffer;
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const index = i * sampleRateRatio;
    const intIndex = Math.floor(index);
    const frac = index - intIndex;
    
    // Linear interpolation for smoother sound
    const s0 = buffer[intIndex];
    const s1 = buffer[intIndex + 1] || s0;
    result[i] = s0 + (s1 - s0) * frac;
  }
  
  return result;
}

export function createPcmBlob(data: Float32Array, sampleRate: number = 16000): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);

  for (let i = 0; i < l; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, data[i]));
    // Convert to PCM16 LE
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  let binary = '';
  
  // Chunking prevents "Maximum call stack size exceeded" (RangeError)
  // and reduces garbage collection pressure compared to byte-by-byte string concatenation.
  const CHUNK_SIZE = 0x8000; // 32KB
  
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    // @ts-ignore: apply accepts TypedArray in modern JS runtimes
    binary += String.fromCharCode.apply(null, chunk);
  }
  
  return {
    data: btoa(binary),
    mimeType: `audio/pcm;rate=${sampleRate}`,
  };
}

export function decodeAudioData(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function convertPCMToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}