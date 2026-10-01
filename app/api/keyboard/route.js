import { exec } from 'child_process';
import { NextResponse } from 'next/server';
import path from 'path';
import { authenticateApiRequest } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { user: authUser, errorResponse } = await authenticateApiRequest(request);
    if (errorResponse) return errorResponse;

    const { action } = await request.json().catch(() => ({}));

    if (!action || (action !== 'right' && action !== 'left')) {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser "right" o "left".' },
        { status: 400 }
      );
    }

    // Si el entorno no es Windows (ej: Vercel / Linux serverless), emular respuesta sin ejecutar comando
    if (process.platform !== 'win32') {
      return NextResponse.json({ 
        success: true, 
        action, 
        mock: true, 
        message: 'Ambiente en la nube (no-Windows), emulación lógica registrada.' 
      });
    }

    // Ruta absoluta del script de PowerShell en entorno local Windows
    const scriptPath = path.join(process.cwd(), 'scripts', 'press_key.ps1');
    const cmd = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" "${action}"`;

    exec(cmd, (error) => {
      if (error) {
        console.error('[API Keyboard] Error en ejecución de hardware:', error.message);
      }
    });

    return NextResponse.json({ success: true, action });

  } catch (err) {
    console.error('[API Keyboard] Error crítico:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
