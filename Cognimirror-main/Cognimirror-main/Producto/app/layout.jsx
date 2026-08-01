import './globals.css';
import Script from 'next/script';
import { BluetoothProvider } from '../contexts/BluetoothContext';
import { CubeStateProvider } from '../contexts/CubeStateContext';
import { JoicubeProvider } from '../contexts/JoicubeContext';
import { AuthProvider } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';

export const metadata = {
  title: 'CogniMirror Cube',
  description: 'Plataforma de evaluación neuropsicológica basada en el Cubo de Rubik inteligente',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#0a0c10] text-gray-100 font-sans min-h-screen antialiased">
        {/* Three.js — required by Classic Dashboard */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <AuthGuard>
            <BluetoothProvider>
              <CubeStateProvider>
                <JoicubeProvider>
                  {children}
                </JoicubeProvider>
              </CubeStateProvider>
            </BluetoothProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

