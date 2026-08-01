'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ShieldAlert } from 'lucide-react';

export default function PasscodeModal({ isOpen, onClose, onVerify }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(false);
    }
  }, [isOpen]);

  const handleKeyPress = (num) => {
    setError(false);
    if (code.length < 4) {
      const nextCode = code + num;
      setCode(nextCode);
      if (nextCode === '1234') {
        setTimeout(() => {
          onVerify();
          onClose();
        }, 150);
      } else if (nextCode.length === 4) {
        // Wrong passcode
        setTimeout(() => {
          setError(true);
          setCode('');
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setCode(code.slice(0, -1));
    setError(false);
  };

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, code]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#0e1017]/90 border border-white/10 p-6 shadow-2xl text-center z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Lock size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Modo Kiosco</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Icon & Title */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                <Lock size={28} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white">Autorización del Supervisor</h3>
              <p className="text-xs text-white/40 max-w-[250px]">
                Ingresa el PIN de seguridad clínica para retornar al portal principal.
              </p>
            </div>

            {/* Passcode dots display */}
            <motion.div 
              animate={error ? { x: [-10, 10, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.35 }}
              className="flex justify-center gap-4 mb-8"
            >
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                    error
                      ? 'bg-red-500/20 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] scale-110'
                      : idx < code.length
                      ? 'bg-purple-500 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)] scale-110'
                      : 'bg-white/5 border-white/10'
                  }`}
                />
              ))}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 bg-red-500/10 py-1.5 rounded-lg border border-red-500/20"
                >
                  <ShieldAlert size={14} />
                  Código incorrecto. Inténtalo de nuevo.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Virtual Keyboard Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="h-14 rounded-2xl bg-white/5 border border-white/5 text-xl font-bold text-white hover:bg-white/10 hover:border-white/10 active:scale-95 active:bg-purple-500/20 transition-all duration-100 flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleKeyPress('0')}
                className="h-14 rounded-2xl bg-white/5 border border-white/5 text-xl font-bold text-white hover:bg-white/10 hover:border-white/10 active:scale-95 active:bg-purple-500/20 transition-all duration-100 flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-100 flex items-center justify-center"
              >
                ⌫
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
