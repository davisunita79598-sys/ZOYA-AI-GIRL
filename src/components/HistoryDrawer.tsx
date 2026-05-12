/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { X, History, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('zoya_history') || "";
      setHistory(saved.split('\n').filter(line => line.trim() !== ""));
    }
  }, [isOpen]);

  const clearHistory = () => {
    if (confirm("Clear all your memories with Zoya?")) {
      localStorage.removeItem('zoya_history');
      setHistory([]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-neutral-900 border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="text-pink-500" size={24} />
                <h2 className="text-xl font-bold text-white tracking-tight">Memories</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-neutral-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-4 opacity-50">
                  <History size={48} />
                  <p className="text-sm font-mono uppercase tracking-widest text-center">
                    No memories yet.<br/>Start talking to Zoya!
                  </p>
                </div>
              ) : (
                history.map((line, i) => {
                  const isZoya = line.startsWith("Zoya:");
                  const text = line.replace(/^(Zoya:|User:)\s*/, "");
                  return (
                    <div 
                      key={i} 
                      className={`flex flex-col ${isZoya ? "items-start" : "items-end"}`}
                    >
                      <span className="text-[10px] font-mono uppercase tracking-tighter text-neutral-600 mb-1">
                        {isZoya ? "Zoya" : "You"}
                      </span>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${
                        isZoya 
                          ? "bg-pink-500/10 text-pink-200 border border-pink-500/20 rounded-tl-none" 
                          : "bg-white/5 text-neutral-300 rounded-tr-none"
                      }`}>
                        {text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {history.length > 0 && (
              <div className="p-6 border-t border-white/5">
                <button
                  onClick={clearHistory}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-sm font-bold transition-all border border-red-500/20"
                >
                  <Trash2 size={18} />
                  Forget Everything
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
