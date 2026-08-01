//App.tsx

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnalysisHistoryProvider, useAnalysisHistory } from './context/AnalysisHistoryContext';
// @ts-ignore
import { BluetoothProvider } from './context/BluetoothContext';
// @ts-ignore
import { CubeStateProvider } from './context/CubeStateContext';
// @ts-ignore
import { JoicubeProvider } from './context/JoicubeContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InstitutionPanel } from './pages/InstitutionPanel';
import { TherapistPanel } from './pages/TherapistPanel';
import { PatientProfile } from './pages/PatientProfile';
import { RubikGamePage } from './pages/RubikGamePage';
import { MirrorHub } from './pages/MirrorHub';
import { MemoryMirror } from './components/mirrors/MemoryMirror';
import { TetrisMirror } from './components/mirrors/TetrisMirror';
import { DigitSpanMirror } from './components/mirrors/DigitSpanMirror';
import { ObserverDashboard } from './pages/ObserverDashboard';
import { Dashboard } from './pages/dashboard';
import { VoiceOnboardingWelcome } from './pages/VoiceOnboardingWelcome';
import { AgendarPage } from './pages/AgendarPage';
import { AdminAgendaPage } from './pages/AdminAgendaPage';
import { metrics } from './services/metrics';
import { AnalyticsDashboard } from './modules/analytics/AnalyticsDashboard';
import { FirestoreTrainingPage } from './pages/FirestoreTrainingPage';

type Page =
  | 'home'
  | 'about'
  | 'what-we-do'
  | 'login'
  | 'register'
  | 'try-now'
  | 'agendar'
  | 'admin-agenda'
  | 'institution-panel'
  | 'therapist-panel'
  | 'patient-profile'
  | 'rubik-game'
  | 'mirror-hub'
  | 'memory-mirror'
  | 'tetris-game'
  | 'digit-span'
  | 'observer-dashboard'
  | 'dashboard'
  | 'enhanced-observer'
  | 'analytics-dashboard'
  | 'firestore-training';

const getPathFromPage = (page: Page): string => {
  switch (page) {
    case 'home': return '/';
    case 'about': return '/about';
    case 'what-we-do': return '/what-we-do';
    case 'login': return '/login';
    case 'register': return '/register';
    case 'try-now': return '/try-now';
    case 'agendar': return '/agendar';
    case 'admin-agenda': return '/admin-agenda';
    case 'analytics-dashboard': return '/dashboard';
    case 'institution-panel': return '/institution-panel';
    case 'therapist-panel': return '/therapist-panel';
    case 'patient-profile': return '/patient-profile';
    case 'rubik-game': return '/rubik-game';
    case 'mirror-hub': return '/mirror-hub';
    case 'memory-mirror': return '/memory-mirror';
    case 'tetris-game': return '/tetris-game';
    case 'digit-span': return '/digit-span';
    case 'observer-dashboard': return '/observer-dashboard';
    case 'enhanced-observer': return '/enhanced-observer';
    case 'firestore-training': return '/firestore-training';
    default: return '/';
  }
};

const getPageFromPath = (path: string): Page => {
  switch (path.toLowerCase()) {
    case '/':
    case '/home':
      return 'home';
    case '/about':
      return 'home';
    case '/what-we-do':
      return 'home';
    case '/login':
      return 'login';
    case '/register':
      return 'register';
    case '/try-now':
      return 'try-now';
    case '/agendar':
      return 'agendar';
    case '/admin-agenda':
      return 'admin-agenda';
    case '/dashboard':
      return 'analytics-dashboard';
    case '/institution-panel':
      return 'institution-panel';
    case '/therapist-panel':
      return 'therapist-panel';
    case '/patient-profile':
      return 'patient-profile';
    case '/rubik-game':
      return 'rubik-game';
    case '/mirror-hub':
      return 'mirror-hub';
    case '/memory-mirror':
      return 'memory-mirror';
    case '/tetris-game':
      return 'tetris-game';
    case '/digit-span':
      return 'digit-span';
    case '/observer-dashboard':
      return 'observer-dashboard';
    case '/enhanced-observer':
      return 'enhanced-observer';
    case '/firestore-training':
      return 'firestore-training';
    default:
      return 'home';
  }
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { currentUser } = useAuth();
  const { addSession } = useAnalysisHistory(); // Hook para agregar sesiones al historial

  useEffect(() => {
    // Manejar la ruta inicial al cargar
    const path = window.location.pathname;
    const initialPage = getPageFromPath(path);
    
    if (currentUser) {
      metrics.setUserId(currentUser.id);
      
      // Permitir mantener la ruta si el usuario accede a páginas públicas o de agendamiento
      if (['agendar', 'admin-agenda', 'home', 'about', 'what-we-do', 'try-now'].includes(initialPage)) {
        setCurrentPage(initialPage);
      } else {
        if (currentUser.type === 'institucional') {
          setCurrentPage('institution-panel');
        } else if (currentUser.type === 'terapeuta') {
          setCurrentPage('therapist-panel');
        } else if (currentUser.type === 'paciente') {
          setCurrentPage('patient-profile');
        }
      }
    } else {
      // Si no hay usuario y está en una ruta privada, redirigir a 'home'
      if ([
        'institution-panel',
        'therapist-panel',
        'patient-profile',
        'rubik-game',
        'mirror-hub',
        'memory-mirror',
        'tetris-game',
        'digit-span',
        'observer-dashboard',
        'enhanced-observer',
        'analytics-dashboard'
      ].includes(initialPage)) {
        setCurrentPage('home');
      } else {
        setCurrentPage(initialPage);
      }
    }

    // Si la ruta inicial es about o what-we-do, hacer scroll después de renderizar
    if (path === '/about' || path === '/what-we-do') {
      setTimeout(() => {
        const sectionId = path.substring(1);
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 500);
    }
  }, [currentUser]);

  useEffect(() => {
    // Iniciar el seguimiento de la página actual
    metrics.startPageView('inicio');

    // Enviar métricas cada minuto
    const interval = setInterval(() => {
      metrics.sendMetrics();
    }, 60000);

    return () => {
      clearInterval(interval);
      metrics.sendMetrics();
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const targetPage = getPageFromPath(path);
      setCurrentPage(targetPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (page: string) => {
    const targetPage = page as Page;
    setCurrentPage(targetPage);
    metrics.startPageView(page);
    
    // Actualizar la URL en el navegador
    const targetPath = getPathFromPage(targetPage);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
      case 'about':
      case 'what-we-do':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'try-now':
        return <VoiceOnboardingWelcome onNavigate={handleNavigate} />;
      case 'agendar':
        return <AgendarPage onNavigate={handleNavigate} />;
      case 'admin-agenda':
        return <AdminAgendaPage onNavigate={handleNavigate} />;
      case 'institution-panel':
        return <InstitutionPanel onNavigate={handleNavigate} />;
      case 'therapist-panel':
        return <TherapistPanel onNavigate={handleNavigate} />;
      case 'patient-profile':
        return <PatientProfile onNavigate={handleNavigate} />;
      case 'rubik-game':
        return <RubikGamePage onNavigate={handleNavigate} />;
      case 'mirror-hub':
        return <MirrorHub onNavigate={handleNavigate} userName={currentUser?.name || 'Usuario'} />;
      case 'memory-mirror':
        return (
          <MemoryMirror
            userId={currentUser?.id || 'demo-user'}
            userName={currentUser?.name || 'Usuario'}
            onBack={() => handleNavigate('mirror-hub')}
            onGameComplete={addSession} // Conectar con sistema de historial
          />
        );
      case 'tetris-game':
        return (
          <TetrisMirror
            userId={currentUser?.id || 'demo-user'}
            userName={currentUser?.name || 'Usuario'}
            onBack={() => handleNavigate('mirror-hub')}
            onGameComplete={addSession} // Conectar con sistema de historial
          />
        );
      case 'digit-span':
        return (
          <DigitSpanMirror
            userId={currentUser?.id || 'demo-user'}
            userName={currentUser?.name || 'Usuario'}
            onBack={() => handleNavigate('mirror-hub')}
            onGameComplete={addSession}
          />
        );
      case 'observer-dashboard':
        return (
          <ObserverDashboard
            onNavigate={handleNavigate}
            userId={currentUser?.id || 'demo-user'}
            userName={currentUser?.name || 'Usuario'}
          />
        );
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'enhanced-observer':
        return (
          <ObserverDashboard
            onNavigate={handleNavigate}
            userId={currentUser?.id || 'demo-user'}
            userName={currentUser?.name || 'Usuario'}
          />
        );
      case 'analytics-dashboard':
        return (
          <AnalyticsDashboard
            userId={currentUser?.id || 'demo-user'}
            userName={currentUser?.name || 'Usuario'}
            onNavigate={handleNavigate}
          />
        );
      case 'firestore-training':
        return <FirestoreTrainingPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const showHeaderFooter = currentPage !== 'rubik-game'
    && currentPage !== 'memory-mirror'
    && currentPage !== 'mirror-hub'
    && currentPage !== 'tetris-game'
    && currentPage !== 'digit-span'
    && currentPage !== 'observer-dashboard'
    && currentPage !== 'dashboard'
    && currentPage !== 'enhanced-observer'
    && currentPage !== 'agendar'
    && currentPage !== 'admin-agenda'
    && currentPage !== 'try-now';

  const showFooter = showHeaderFooter && currentPage !== 'home' && currentPage !== 'about' && currentPage !== 'what-we-do';

  return (
    <div className="min-h-screen flex flex-col">
      {showHeaderFooter && <Header onNavigate={handleNavigate} currentPage={currentPage} />}
      <main className="flex-1">{renderPage()}</main>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AnalysisHistoryProvider>
        <BluetoothProvider>
          <CubeStateProvider>
            <JoicubeProvider>
              <AppContent />
            </JoicubeProvider>
          </CubeStateProvider>
        </BluetoothProvider>
      </AnalysisHistoryProvider>
    </AuthProvider>
  );
}

export default App;
