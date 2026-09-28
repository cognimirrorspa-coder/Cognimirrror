'use client';

import { useState, useEffect } from 'react';
import { Download, Check, Sparkles, Smartphone, X } from 'lucide-react';

export default function PwaInstallButton({ isDark = true, className = '', showFullWidth = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Verificar si ya está corriendo como PWA instalada
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (isStandalone) {
        setIsInstalled(true);
      }

      // Detectar iOS
      const ua = window.navigator.userAgent.toLowerCase();
      const isIphoneOrIpad = /iphone|ipad|ipod/.test(ua);
      setIsIos(isIphoneOrIpad);

      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Si el navegador no disparó el evento (ej. ya instalada o en desktop chrome)
      alert('CogniMirror ya está listo para ser instalado. Haz clic en el ícono de instalación en la barra de direcciones de tu navegador.');
    }
  };

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold shrink-0 ${
        showFullWidth ? 'w-full justify-center' : ''
      } ${
        isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      } ${className}`}>
        <Check className="w-3.5 h-3.5 shrink-0" />
        <span>PWA Instalada</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0 active:scale-95 ${
          showFullWidth 
            ? 'w-full py-2.5 px-3' 
            : 'px-2.5 py-1.5 sm:px-3 sm:py-1.5'
        } ${
          isDark
            ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40 shadow-blue-500/10'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
        } ${className}`}
        title="Instalar CogniMirror como aplicación nativa PWA en este dispositivo"
      >
        <Download className="w-3.5 h-3.5 animate-bounce shrink-0 text-blue-400" />
        <span className="hidden sm:inline">Instalar PWA</span>
        <span className="sm:hidden text-[10px] font-mono">Instalar</span>
      </button>

      {/* Guía para iOS Safari */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`max-w-sm w-full p-6 rounded-3xl border shadow-2xl relative ${
            isDark ? 'bg-[#151926] border-[#222736] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Instalar en tu iPhone o iPad</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Para instalar CogniMirror como app nativa en Safari de Apple:
            </p>
            <ol className="mt-4 space-y-2 text-xs text-slate-300 list-decimal list-inside font-medium">
              <li>Toca el botón <strong>Compartir</strong> <span className="text-blue-400">⎋</span> en la barra inferior de Safari.</li>
              <li>Desliza hacia abajo y selecciona <strong>&quot;Agregar al inicio&quot;</strong> <span className="text-blue-400">⊞</span>.</li>
              <li>Toca <strong>&quot;Agregar&quot;</strong> en la esquina superior derecha.</li>
            </ol>
            <button
              onClick={() => setShowIosGuide(false)}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
