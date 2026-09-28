import { NextResponse } from 'next/server';
import { solveCubeState } from '../../../utils/kociembaSolver';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = solveCubeState(body);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Configuración de cubo inválida.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en API /api/solve-cube:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno resolviendo el cubo.' 
      },
      { status: 500 }
    );
  }
}
