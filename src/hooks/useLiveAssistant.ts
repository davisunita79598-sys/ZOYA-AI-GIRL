/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioStreamer } from '../lib/audio-streamer';
import { LiveSession } from '../lib/live-session';

export function useLiveAssistant() {
  const [state, setState] = useState<string>('disconnected');
  const [transcript, setTranscript] = useState<{ text: string, isUser: boolean }[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const updateVolume = () => {
      if (audioStreamerRef.current) {
        setVolume(audioStreamerRef.current.getVolume());
      }
      rafRef.current = requestAnimationFrame(updateVolume);
    };
    rafRef.current = requestAnimationFrame(updateVolume);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Handle unexpected disconnections or graceful session end
  useEffect(() => {
    if (state === 'disconnected' || state === 'error') {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
        audioStreamerRef.current = null;
      }
      if (liveSessionRef.current) {
        liveSessionRef.current = null;
      }
    }
  }, [state]);

  const onAudioData = useCallback((base64: string) => {
    liveSessionRef.current?.sendAudio(base64);
  }, []);

  const onAudioOutput = useCallback((base64: string) => {
    audioStreamerRef.current?.handleOutputAudio(base64);
  }, []);

  const onInterrupted = useCallback(() => {
    audioStreamerRef.current?.stopPlayback();
  }, []);

  const onTranscription = useCallback((text: string, isUser: boolean) => {
    setTranscript(prev => [...prev.slice(-4), { text, isUser }]);
  }, []);

  const toggleConnection = async () => {
    if (state === 'disconnected') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("API Key missing. Please check your secrets.");
        return;
      }

      audioStreamerRef.current = new AudioStreamer(onAudioData);
      liveSessionRef.current = new LiveSession(
        apiKey,
        onAudioOutput,
        onInterrupted,
        setState,
        onTranscription
      );

      try {
        await audioStreamerRef.current.start();
        await liveSessionRef.current.connect();
      } catch (err) {
        console.error("Failed to start session:", err);
        setState('error');
      }
    } else {
      audioStreamerRef.current?.stop();
      liveSessionRef.current?.disconnect();
      audioStreamerRef.current = null;
      liveSessionRef.current = null;
      setState('disconnected');
    }
  };

  return {
    state,
    toggleConnection,
    transcript,
    volume
  };
}
