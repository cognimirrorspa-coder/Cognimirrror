import { exec } from 'child_process';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request) {
  try {
    const { action } = await request.json();

    if (!action || (action !== 'right' && action !== 'left')) {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser "right" o "left".' },
        { status: 400 }
      );
    }

    // Ruta absoluta del script de PowerShell
    const scriptPath = path.join(process.cwd(), 'scripts', 'press_key.ps1');

    // Ejecutar PowerShell con política de bypass y pasar la acción como parámetro
    const cmd = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" "${action}"`;

    console.log(`[API Keyboard] Inyectando tecla física global de Windows: ${action.toUpperCase()}`);

    // Ejecutar el comando de forma asíncrona de inmediato
    exec(cmd, (error) => {
      if (error) {
        console.error('[API Keyboard] Error ejecutando inyección de hardware:', error.message);
      }
    });

    return NextResponse.json({ success: true, action });

  } catch (err) {
    console.error('[API Keyboard] Error crítico:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
