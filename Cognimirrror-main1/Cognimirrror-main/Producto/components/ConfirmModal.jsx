import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#111218] border border-red-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-sm w-full text-center flex flex-col gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 text-3xl">
              ⚠️
            </div>
            
            <div>
              <h2 className="text-xl font-black text-white mb-2">{title}</h2>
              <p className="text-white/60 text-sm leading-relaxed">{message}</p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                Sí, Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
