/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private onAudioData: (base64: string) => void;
  private nextStartTime = 0;
  private sampleRate = 16000;
  private outputSampleRate = 24000;
  private analyser: AnalyserNode | null = null;

  constructor(onAudioData: (base64: string) => void) {
    this.onAudioData = onAudioData;
  }

  async start() {
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.playbackContext = new AudioContext({ sampleRate: this.outputSampleRate });
    this.analyser = this.playbackContext.createAnalyser();
    this.analyser.connect(this.playbackContext.destination);
    this.analyser.fftSize = 256;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = this.floatTo16BitPCM(inputData);
      const base64Data = this.arrayBufferToBase64(pcmData.buffer);
      this.onAudioData(base64Data);
    };
  }

  stop() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    this.playbackContext?.close();
    this.audioContext = null;
    this.playbackContext = null;
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.nextStartTime = 0;
  }

  handleOutputAudio(base64Data: string) {
    if (!this.playbackContext) return;

    const arrayBuffer = this.base64ToArrayBuffer(base64Data);
    const pcmData = new Int16Array(arrayBuffer);
    const floatData = new Float32Array(pcmData.length);
    
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0;
    }

    const buffer = this.playbackContext.createBuffer(1, floatData.length, this.outputSampleRate);
    buffer.getChannelData(0).set(floatData);
    
    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser!);
    
    const now = this.playbackContext.currentTime;
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.05; // Small buffer
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  getVolume() {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
    }
    return Math.sqrt(sum / dataArray.length);
  }

  stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      this.playbackContext = new AudioContext({ sampleRate: this.outputSampleRate });
      this.analyser = this.playbackContext.createAnalyser();
      this.analyser.connect(this.playbackContext.destination);
      this.analyser.fftSize = 256;
      this.nextStartTime = 0;
    }
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
