import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientSelector({ patients, onSelect, onCreate }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 relative z-20">
      <AnimatePresence mode="wait">
        {!isCreating ? (
          <motion.div 
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-3"
          >
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) onSelect(e.target.value);
                }}
                defaultValue=""
                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white appearance-none cursor-pointer text-lg font-semibold focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="" disabled className="text-gray-500 bg-gray-900">
                  Seleccionar Paciente Existente...
                </option>
                {patients.map(p => (
                  <option key={p.id} value={p.id} className="bg-gray-900 text-white">
                    {p.name} ({p.sessions?.length || 0} sesiones)
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                ▼
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-white/30 uppercase tracking-widest font-bold">O</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-4 rounded-xl font-bold text-purple-400 hover:text-white hover:bg-purple-500/20 transition-all border border-purple-500/30 border-dashed"
            >
              + Crear Nuevo Paciente
            </button>
          </motion.div>
        ) : (
          <motion.form 
            key="create"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleCreate}
            className="flex flex-col gap-3"
          >
            <input 
              type="text"
              autoFocus
              placeholder="Nombre del Nuevo Paciente"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/10 border border-purple-500/50 text-white placeholder-white/30 text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-semibold"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 rounded-xl font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newName.trim()}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                Crear y Seleccionar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
