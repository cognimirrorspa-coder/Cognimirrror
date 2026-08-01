//Footer.tsx

import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4 cursor-default">
              <h3 className="text-xl font-bold bg-[linear-gradient(90deg,#9333ea_0%,#3b82f6_25%,#9333ea_50%,#3b82f6_75%,#9333ea_100%)] bg-[length:200%_auto] bg-clip-text text-transparent animate-aurora">CogniMirror</h3>
            </div>
            <p className="text-sm">
              Plataforma educativa especializada en desarrollo cognitivo para niños con TEA y TDAH.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contacto</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>cognimirrorspa@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+56 979 430 387</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="hover:text-blue-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="hover:text-blue-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="hover:text-blue-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} CogniMirror. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
