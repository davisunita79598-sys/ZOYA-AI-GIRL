/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { Mic, Power, Settings, Globe, MessageCircle, History as HistoryIcon } from "lucide-react";
import { useLiveAssistant } from "./hooks/useLiveAssistant";
import Waveform from "./components/Waveform";
import ZoyaFace from "./components/ZoyaFace";
import HistoryDrawer from "./components/HistoryDrawer";
import { useState } from "react";

import ReactMarkdown from "react-markdown";

export default function App() {
  const { state, toggleConnection, transcript, volume } = useLiveAssistant();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isConnecting = state === 'connecting';
  const isConnected = state !== 'disconnected' && state !== 'error';
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';

  const getStatusText = () => {
    switch (state) {
      case 'disconnected': return 'Tap to summon Zoya';
      case 'connecting': return 'Zoya is arriving...';
      case 'listening': return 'Listening to you...';
      case 'speaking': return 'Zoya is talking';
      case 'error': return 'She\'s taking a break';
      default: return 'Online';
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 text-white font-sans selection:bg-pink-500/30 flex flex-col items-center justify-between py-12 px-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: isSpeaking ? [1, 1 + volume * 0.5, 1] : 1,
            opacity: isConnected ? 0.3 + volume * 0.5 : 0.2,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{
            scale: isListening ? [1, 1.1, 1] : 1,
            opacity: isConnected ? [0.3, 0.5, 0.3] : 0.1,
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px]" 
        />
      </div>

      {/* Header */}
      <div className="relative z-10 w-full flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            ZOYA
          </h1>
          <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">
            Indian Girl Persona • Live
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
          >
            <HistoryIcon size={20} className="text-neutral-400" />
          </button>
          <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
            <Settings size={20} className="text-neutral-400" />
          </button>
        </div>
      </div>

      {/* History Drawer */}
      <HistoryDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      {/* Main Interaction Area */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm flex-1 justify-center">
        {/* Transcription Preview (Minimalist) */}
        <div className="h-20 w-full flex flex-col justify-end gap-2 overflow-hidden mb-4">
          <AnimatePresence mode="popLayout">
            {transcript.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: t.isUser ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs px-3 py-1.5 rounded-xl max-w-[75%] prose prose-invert prose-p:my-0 prose-a:text-pink-400 prose-a:underline overflow-hidden break-words ${
                  t.isUser 
                    ? "bg-white/5 text-neutral-400 self-end" 
                    : "bg-pink-500/10 text-pink-300 self-start border border-pink-500/20"
                }`}
              >
                <ReactMarkdown>{t.text}</ReactMarkdown>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Zoya's Face Area */}
        <div className="relative flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {state === 'disconnected' ? (
              <motion.button
                key="power-btn"
                id="zoya-trigger"
                onClick={toggleConnection}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-64 h-64 rounded-full flex items-center justify-center border-4 border-neutral-800 bg-neutral-900 shadow-2xl group transition-all"
              >
                <div className="flex flex-col items-center gap-4">
                  <Power size={80} className="text-neutral-700 transition-colors group-hover:text-pink-500" />
                  <span className="text-neutral-500 font-mono text-[10px] tracking-widest uppercase">Tap to wake up</span>
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="zoya-face"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative flex flex-col items-center"
              >
                <ZoyaFace isSpeaking={isSpeaking} isListening={isListening} state={state} volume={volume} />
                
                {/* Controls Overlay */}
                <div className="absolute -bottom-6 flex items-center gap-4">
                  <motion.button
                    onClick={toggleConnection}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-4 bg-neutral-900 border-2 border-neutral-800 rounded-full shadow-2xl text-red-500 z-30"
                  >
                    <Power size={24} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Visualizer & Status */}
        <div className="w-full flex flex-col items-center gap-6 mt-8">
          <Waveform isSpeaking={isSpeaking} isListening={isListening} />
          <motion.p
            key={state}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold tracking-tight text-white text-center drop-shadow-lg"
          >
            {getStatusText()}
          </motion.p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 w-full flex justify-around items-center pt-8 border-t border-white/5 max-w-sm">
        <div className="flex flex-col items-center gap-1 opacity-50">
          <Globe size={20} />
          <span className="text-[10px] font-mono tracking-tighter uppercase">Indian Accent</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-pink-500">
          <MessageCircle size={20} />
          <span className="text-[10px] font-mono tracking-tighter uppercase font-bold">Witty & Sassy</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <Mic size={20} />
          <span className="text-[10px] font-mono tracking-tighter uppercase">PCM 16k</span>
        </div>
      </div>
    </div>
  );
}


