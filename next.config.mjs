/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false, // Ocultar cabecera X-Powered-By: Next.js (OWASP A05)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 1. Forzar HTTPS estricto por 2 años con inclusión de subdominios
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // 2. Prevenir Clickjacking bloqueando iframes externos
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // 3. Prevenir ataques de confusión de tipo MIME
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // 4. Proteger información de referencia en navegación
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // 5. Restringir permisos de hardware (Ley 21.719 / Privacidad)
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=()'
          },
          // 6. X-XSS-Protection (Defensa en profundidad)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // 7. Content Security Policy (Anti-Perfilamiento y Anti-Inyección Ley 19.496 / Ley 21.719)
          // Bloquea expresamente redes de anuncios, rastreadores comerciales y scripts no autorizados
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://viqtdxvoryovilzsfhwu.supabase.co https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
