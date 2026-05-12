/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";

interface ZoyaFaceProps {
  isSpeaking: boolean;
  isListening: boolean;
  state: string;
  volume?: number;
}

export default function ZoyaFace({ isSpeaking, isListening, state, volume = 0 }: ZoyaFaceProps) {
  return (
    <div className="relative w-80 h-80 rounded-full overflow-hidden border-8 border-pink-500/20 shadow-[0_0_100px_-20px_rgba(236,72,153,0.4)] bg-neutral-900 group">
      {/* Dynamic Image */}
      <motion.img
        src="/src/assets/images/regenerated_image_1778592731905.png"
        alt="Zoya"
        animate={{
          scale: isSpeaking ? [1, 1 + volume * 0.05, 1] : isListening ? [1, 1.01, 1] : 1,
        }}
        transition={{ 
          duration: isSpeaking ? 0.1 : 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`w-full h-full object-cover transition-all duration-700 ${
          state === 'disconnected' ? "grayscale blur-sm contrast-75" : "grayscale-0 contrast-125 select-none"
        }`}
        referrerPolicy="no-referrer"
      />

      {/* Realistic Lip-Sync Mouth Animation */}
      <div className="absolute top-[72%] left-[50%] -translate-x-1/2 flex flex-col items-center gap-[1px]">
        <AnimatePresence>
          {state !== 'disconnected' && (
            <div className="relative flex flex-col items-center gap-[2px]">
              {/* Upper Lip */}
              <motion.div 
                animate={{ 
                  y: isSpeaking ? -volume * 8 : 0,
                  width: isSpeaking ? 24 + volume * 12 : 20,
                  scaleX: isSpeaking ? 1 + volume * 0.2 : 1
                }}
                className="h-[2px] bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.8)] rounded-full z-10"
              />
              
              {/* Mouth Gap */}
              <motion.div 
                animate={{ 
                  height: isSpeaking ? volume * 24 : 0,
                  opacity: isSpeaking ? 0.6 : 0,
                  width: isSpeaking ? 20 + volume * 16 : 16
                }}
                className="bg-black/80 rounded-full backdrop-blur-md"
              />

              {/* Lower Lip */}
              <motion.div 
                animate={{ 
                  y: isSpeaking ? volume * 8 : 0,
                  width: isSpeaking ? 24 + volume * 12 : 20,
                  scaleX: isSpeaking ? 1 + volume * 0.2 : 1
                }}
                className="h-[2px] bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)] rounded-full z-10"
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Listening Pulse Overlay */}
      {isListening && (
        <motion.div
          animate={{
            borderColor: ["rgba(236,72,153,0.1)", "rgba(236,72,153,0.5)", "rgba(236,72,153,0.1)"],
            boxShadow: ["inset 0 0 0px rgba(236,72,153,0)", "inset 0 0 40px rgba(236,72,153,0.2)", "inset 0 0 0px rgba(236,72,153,0)"]
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-[10px] pointer-events-none"
        />
      )}
    </div>
  );
}
