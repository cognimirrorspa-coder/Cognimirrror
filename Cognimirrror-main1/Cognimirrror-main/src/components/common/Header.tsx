//Header.tsx

import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  activeSection?: string;
}

export const Header = ({ onNavigate, currentPage, activeSection = 'home' }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  
  // Función para manejar la navegación a sección
  const handleNavigation = (section: string) => {
    onNavigate('home');
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(section);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const isDarkPage = ['home', 'about', 'what-we-do'].includes(currentPage);
  
  // Refined Deep Tech dark header
  const headerBgClass = isDarkPage 
    ? 'bg-[#0B0F19]/80 border-b border-white/10 backdrop-blur-md sticky top-0 z-50'
    : 'bg-white shadow-md sticky top-0 z-50';

  const linkClass = (section: string) => {
    const isActive = activeSection === section || (currentPage === 'home' && activeSection === section);
    if (isDarkPage) {
      return `font-medium text-xs uppercase tracking-wider transition-colors ${
        isActive ? 'text-[#3B82F6] font-bold' : 'text-slate-300 hover:text-white'
      }`;
    } else {
      return `font-medium text-xs uppercase tracking-wider transition-colors ${
        isActive ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'
      }`;
    }
  };

  const mobileLinkClass = (section: string) => {
    const isActive = activeSection === section;
    if (isDarkPage) {
      return `block w-full text-left px-4 py-2 rounded-lg text-sm ${
        isActive ? 'text-[#3B82F6] bg-white/5 font-bold' : 'text-slate-300 hover:bg-white/5'
      }`;
    } else {
      return `block w-full text-left px-4 py-2 rounded-lg text-sm ${
        isActive ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600 hover:bg-blue-50'
      }`;
    }
  };

  return (
    <header className={headerBgClass}>
      {/* Barra de Anuncio del Estudio Clínico */}
      {isDarkPage && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white py-2.5 px-4 text-center text-xs font-semibold relative z-50 shadow-md flex flex-col sm:flex-row items-center justify-center gap-3 border-b border-white/5">
          <span className="flex items-center gap-1.5 drop-shadow-sm font-sans tracking-wide">
            🎓 ¿Eres estudiante? Súmate al estudio de CogniMirror 2026 y obtén tu reporte neurocognitivo gratis.
          </span>
          <button 
            onClick={() => onNavigate('agendar')}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black rounded-full transition-all text-[11px] uppercase tracking-wider animate-pulse hover:scale-105 shadow-md flex items-center gap-1"
          >
            ¡Presiona aquí para Agendar! 🗓️
          </button>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🧠</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">CogniMirror</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {!currentUser ? (
              <>
                <button
                  onClick={() => handleNavigation('home')}
                  className={linkClass('home')}
                >
                  Inicio
                </button>
                <button
                  onClick={() => handleNavigation('about')}
                  className={linkClass('about')}
                >
                  Quiénes Somos
                </button>
                <button
                  onClick={() => handleNavigation('what-we-do')}
                  className={linkClass('what-we-do')}
                >
                  Qué Hacemos
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Iniciar sesión
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${isDarkPage ? 'text-slate-300' : 'text-gray-700'}`}>
                  <User className="w-5 h-5" />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isDarkPage ? 'text-rose-400 hover:bg-white/5' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </nav>

          <button
            className={`md:hidden ${isDarkPage ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {!currentUser ? (
              <>
                <button
                  onClick={() => {
                    handleNavigation('home');
                    setIsMenuOpen(false);
                  }}
                  className={mobileLinkClass('home')}
                >
                  Inicio
                </button>
                <button
                  onClick={() => {
                    handleNavigation('about');
                    setIsMenuOpen(false);
                  }}
                  className={mobileLinkClass('about')}
                >
                  Quiénes Somos
                </button>
                <button
                  onClick={() => {
                    handleNavigation('what-we-do');
                    setIsMenuOpen(false);
                  }}
                  className={mobileLinkClass('what-we-do')}
                >
                  Qué Hacemos
                </button>
                <button
                  onClick={() => {
                    onNavigate('login');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Iniciar sesión
                </button>
              </>
            ) : (
              <>
                <div className={`px-4 py-2 font-medium ${isDarkPage ? 'text-slate-300' : 'text-gray-700'}`}>
                  {currentUser.name}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 rounded-lg ${
                    isDarkPage ? 'text-rose-400 hover:bg-white/5' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  Salir
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
