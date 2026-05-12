/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

interface WaveformProps {
  isSpeaking: boolean;
  isListening: boolean;
  color?: string;
}

export default function Waveform({ isSpeaking, isListening, color = "#ec4899" }: WaveformProps) {
  const barCount = 12;
  
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            height: isSpeaking ? [8, 32, 12, 48, 16] : isListening ? [8, 16, 8] : 4,
            opacity: isSpeaking || isListening ? 1 : 0.3,
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
