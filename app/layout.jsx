import './globals.css';
import Script from 'next/script';
import { BluetoothProvider } from '../contexts/BluetoothContext';
import { CubeStateProvider } from '../contexts/CubeStateContext';
import { JoicubeProvider } from '../contexts/JoicubeContext';
import { AuthProvider } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

import GlobalBluetoothButton from '../components/GlobalBluetoothButton';

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata = {
  title: 'CogniMirror Cube',
  description: 'Plataforma de evaluación neuropsicológica basada en el Cubo de Rubik inteligente',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CogniMirror',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/logo.png',
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="bg-[#0a0c10] text-gray-100 font-sans min-h-screen antialiased">
        <ServiceWorkerRegister />
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
                  <GlobalBluetoothButton />
                </JoicubeProvider>
              </CubeStateProvider>
            </BluetoothProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

