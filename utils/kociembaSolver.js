import Cube from 'cubejs';

// Inicializar tablas del algoritmo de dos fases de Herbert Kociemba
let isSolverInitialized = false;
function ensureSolverReady() {
  if (!isSolverInitialized) {
    Cube.initSolver();
    isSolverInitialized = true;
  }
}

// Configuración canónica de colores y orientación para CogniMirror
// F: Azul, U: Blanco, L: Rojo, R: Naranjo, D: Amarillo, B: Verde
export const CUBE_COLORS = {
  F: { name: 'Azul', hex: '#0066ff', textClass: 'text-blue-500', bgClass: 'bg-blue-600', position: 'Frente' },
  U: { name: 'Blanco', hex: '#ffffff', textClass: 'text-slate-100', bgClass: 'bg-slate-100', position: 'Arriba' },
  L: { name: 'Rojo', hex: '#ff1744', textClass: 'text-red-500', bgClass: 'bg-red-600', position: 'Izquierda' },
  R: { name: 'Naranja', hex: '#ff6d00', textClass: 'text-orange-500', bgClass: 'bg-orange-500', position: 'Derecha' },
  D: { name: 'Amarillo', hex: '#ffd000', textClass: 'text-yellow-400', bgClass: 'bg-yellow-400', position: 'Abajo' },
  B: { name: 'Verde', hex: '#00e676', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500', position: 'Atrás' }
};

export const COLOR_KEYS = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * Convierte un string de 54 facetas a un mapa { U: [...], R: [...], ... }
 */
export function stringToFaces(str) {
  if (typeof str !== 'string' || str.length !== 54) return null;
  return {
    U: str.slice(0, 9).split(''),
    R: str.slice(9, 18).split(''),
    F: str.slice(18, 27).split(''),
    D: str.slice(27, 36).split(''),
    L: str.slice(36, 45).split(''),
    B: str.slice(45, 54).split('')
  };
}

/**
 * Convierte un mapa de caras { U, R, F, D, L, B } a un string de 54 facetas
 */
export function facesToString(faces) {
  if (!faces) return 'U'.repeat(9) + 'R'.repeat(9) + 'F'.repeat(9) + 'D'.repeat(9) + 'L'.repeat(9) + 'B'.repeat(9);
  const order = ['U', 'R', 'F', 'D', 'L', 'B'];
  let str = '';
  for (const f of order) {
    const arr = faces[f];
    if (Array.isArray(arr) && arr.length === 9) {
      str += arr.join('');
    } else {
      str += f.repeat(9);
    }
  }
  return str;
}

/**
 * Genera un desarme aleatorio 100% matemáticamente válido
 */
export function generateRandomValidCube() {
  ensureSolverReady();
  const c = new Cube();
  c.randomize();
  const str = c.asString();
  return {
    faceletString: str,
    faces: stringToFaces(str)
  };
}

/**
 * Obtiene el estado de caras a partir de una secuencia de movimientos
 */
export function getFacesFromMoves(moves) {
  const cube = new Cube();
  if (Array.isArray(moves) && moves.length > 0) {
    const validMoves = moves
      .map(m => (typeof m === 'string' ? m.trim() : ''))
      .filter(m => /^[UDFBLR][2']?$/i.test(m))
      .map(m => m.toUpperCase());
    if (validMoves.length > 0) {
      cube.move(validMoves.join(' '));
    }
  }
  return stringToFaces(cube.asString());
}

/**
 * Aplica un movimiento (ej. 'R', "U'", 'D2') a un estado de caras { U, R, F, D, L, B }
 */
export function applyMoveToFaces(faces, moveNotation) {
  if (!faces || !moveNotation) return faces;
  try {
    const str = facesToString(faces);
    const cube = Cube.fromString(str);
    cube.move(moveNotation.trim().toUpperCase());
    return stringToFaces(cube.asString());
  } catch (e) {
    console.warn('[applyMoveToFaces] Error aplicando movimiento:', e);
    return faces;
  }
}

/**
 * Validador estricto de leyes de permutación del Cubo Rubik 3x3x3
 * Evita búsquedas infinitas que cuelguen el hilo de JavaScript
 */
export function validateCubeState(cube, str) {
  // 1. Debe haber exactamente 9 de cada color
  if (typeof str === 'string' && str.length === 54) {
    const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
    for (let i = 0; i < 54; i++) {
      counts[str[i]] = (counts[str[i]] || 0) + 1;
    }
    for (const k of ['U', 'R', 'F', 'D', 'L', 'B']) {
      if (counts[k] !== 9) {
        return { 
          valid: false, 
          error: `Conteo inválido: Hay ${counts[k] || 0} facetas de color ${CUBE_COLORS[k]?.name || k} (deben ser exactamente 9 de cada uno).` 
        };
      }
    }
  }

  // 2. Verificar que las 8 esquinas existan sin duplicados
  if (!cube.cp || cube.cp.length !== 8) {
    return { valid: false, error: 'La configuración de esquinas está incompleta o tiene combinaciones de colores incompatibles.' };
  }
  for (let i = 0; i < 8; i++) {
    if (typeof cube.cp[i] !== 'number' || cube.cp[i] < 0 || cube.cp[i] > 7) {
      return { valid: false, error: 'Hay esquinas con combinaciones de colores que no existen en un cubo 3x3x3 real.' };
    }
  }
  const cpSet = new Set(cube.cp);
  if (cpSet.size !== 8) {
    return { valid: false, error: 'Hay esquinas duplicadas o repetidas en los colores ingresados.' };
  }

  // 3. Suma de orientación de esquinas divisible por 3
  let coSum = 0;
  for (let i = 0; i < 8; i++) {
    coSum += (cube.co[i] || 0);
  }
  if (coSum % 3 !== 0) {
    return { valid: false, error: 'Orientación de esquinas imposible: una esquina fue rotada físicamente de forma aislada.' };
  }

  // 4. Verificar que los 12 bordes existan sin duplicados
  if (!cube.ep || cube.ep.length !== 12) {
    return { valid: false, error: 'La configuración de bordes está incompleta o tiene colores incompatibles.' };
  }
  for (let i = 0; i < 12; i++) {
    if (typeof cube.ep[i] !== 'number' || cube.ep[i] < 0 || cube.ep[i] > 11) {
      return { valid: false, error: 'Hay bordes con pares de colores imposibles en un cubo 3x3x3 real.' };
    }
  }
  const epSet = new Set(cube.ep);
  if (epSet.size !== 12) {
    return { valid: false, error: 'Hay bordes duplicados o repetidos en los colores ingresados.' };
  }

  // 5. Orientación de bordes divisible por 2
  let eoSum = 0;
  for (let i = 0; i < 12; i++) {
    eoSum += (cube.eo[i] || 0);
  }
  if (eoSum % 2 !== 0) {
    return { valid: false, error: 'Orientación de bordes imposible: un borde fue volteado físicamente de forma aislada.' };
  }

  // 6. Paridad de permutaciones (esquinas y bordes deben tener igual paridad)
  function getPermutationParity(arr) {
    let inversions = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inversions++;
      }
    }
    return inversions % 2;
  }

  if (getPermutationParity(cube.cp) !== getPermutationParity(cube.ep)) {
    return { valid: false, error: 'Paridad imposible: dos piezas están intercambiadas de forma que viola las leyes del cubo de Rubik.' };
  }

  return { valid: true };
}

/**
 * Traduce una notación clásica (ej. R', U2, F) en instrucciones visuales y lenguaje natural
 */
export function explainMove(notation, stepIndex = 0, totalSteps = 1) {
  if (!notation) return null;
  const face = notation[0].toUpperCase();
  const modifier = notation.slice(1);
  const colorInfo = CUBE_COLORS[face] || { name: 'Desconocido', hex: '#3b82f6', position: 'Cara' };

  let turnType = 'clockwise';
  let angle = 90;
  let simpleDirection = 'en sentido del reloj (horario) ↻';
  let detailedMovement = '';

  if (modifier === "'") {
    turnType = 'counter-clockwise';
    angle = -90;
    simpleDirection = 'contra el reloj (antihorario) ↺';
  } else if (modifier === '2') {
    turnType = 'double';
    angle = 180;
    simpleDirection = 'media vuelta (180°)';
  }

  switch (face) {
    case 'F': // Azul, frente
      if (modifier === "'") detailedMovement = 'Gira la cara AZUL hacia la izquierda ↺';
      else if (modifier === '2') detailedMovement = 'Gira la cara AZUL dos veces (180°)';
      else detailedMovement = 'Gira la cara AZUL hacia la derecha ↻';
      break;
    case 'U': // Blanco, arriba
      if (modifier === "'") detailedMovement = 'Gira la cara BLANCA (arriba) hacia la derecha ↺';
      else if (modifier === '2') detailedMovement = 'Gira la cara BLANCA (arriba) dos veces';
      else detailedMovement = 'Gira la cara BLANCA (arriba) hacia la izquierda ↻';
      break;
    case 'R': // Naranja, derecha
      if (modifier === "'") detailedMovement = 'Gira la cara NARANJA (derecha) hacia abajo / adelante';
      else if (modifier === '2') detailedMovement = 'Gira la cara NARANJA (derecha) dos veces';
      else detailedMovement = 'Gira la cara NARANJA (derecha) hacia arriba / atrás';
      break;
    case 'L': // Rojo, izquierda
      if (modifier === "'") detailedMovement = 'Gira la cara ROJA (izquierda) hacia arriba / atrás';
      else if (modifier === '2') detailedMovement = 'Gira la cara ROJA (izquierda) dos veces';
      else detailedMovement = 'Gira la cara ROJA (izquierda) hacia abajo / adelante';
      break;
    case 'D': // Amarillo, abajo
      if (modifier === "'") detailedMovement = 'Gira la cara AMARILLA (abajo) hacia la izquierda';
      else if (modifier === '2') detailedMovement = 'Gira la cara AMARILLA (abajo) dos veces';
      else detailedMovement = 'Gira la cara AMARILLA (abajo) hacia la derecha';
      break;
    case 'B': // Verde, atrás
      if (modifier === "'") detailedMovement = 'Gira la cara VERDE (atrás) hacia la derecha';
      else if (modifier === '2') detailedMovement = 'Gira la cara VERDE (atrás) dos veces';
      else detailedMovement = 'Gira la cara VERDE (atrás) hacia la izquierda';
      break;
    default:
      detailedMovement = `Gira la cara ${face} ${simpleDirection}`;
  }

  return {
    stepIndex,
    stepNumber: stepIndex + 1,
    totalSteps,
    notation,
    face,
    colorName: colorInfo.name,
    colorHex: colorInfo.hex,
    positionName: colorInfo.position,
    turnType,
    angle,
    simpleDirection,
    detailedMovement,
    title: `Paso ${stepIndex + 1}: Cara ${colorInfo.name.toUpperCase()} (${colorInfo.position})`,
    orientationGuide: 'Mantén el cubo con la cara AZUL al frente y BLANCA arriba'
  };
}

/**
 * Resuelve el cubo mediante el Algoritmo Kociemba (Dos Fases) con validación previa
 */
export function solveCubeState(input = {}) {
  try {
    ensureSolverReady();

    let cube;
    let strRepresentation = '';

    if (Array.isArray(input.moves) && input.moves.length > 0) {
      cube = new Cube();
      const validMoves = input.moves
        .map(m => (typeof m === 'string' ? m.trim() : ''))
        .filter(m => /^[UDFBLR][2']?$/i.test(m))
        .map(m => m.toUpperCase());

      if (validMoves.length > 0) {
        cube.move(validMoves.join(' '));
      }
      strRepresentation = cube.asString();
    } else if (typeof input.faceletString === 'string' && input.faceletString.length === 54) {
      strRepresentation = input.faceletString;
      cube = Cube.fromString(strRepresentation);
    } else if (input.faces) {
      strRepresentation = facesToString(input.faces);
      cube = Cube.fromString(strRepresentation);
    } else {
      cube = new Cube();
      strRepresentation = cube.asString();
    }

    // Verificar si ya está resuelto
    const solvedStr = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
    if (strRepresentation === solvedStr) {
      return {
        success: true,
        isSolved: true,
        totalMoves: 0,
        solution: '',
        moves: [],
        steps: [],
        message: '¡El cubo ya está completamente armado y ordenado!'
      };
    }

    // VALIDACIÓN MATEMÁTICA PREVIA: Evita bucles infinitos en configuraciones imposibles
    const validation = validateCubeState(cube, strRepresentation);
    if (!validation.valid) {
      return {
        success: false,
        isSolved: false,
        error: validation.error || 'La configuración del cubo no es armable en un cubo 3x3x3 real.'
      };
    }

    // Ejecutar solución de dos fases (Kociemba) con límite de profundidad 22
    const solutionString = cube.solve(22).trim();
    const moves = solutionString ? solutionString.split(/\s+/).filter(Boolean) : [];
    const totalMoves = moves.length;

    const steps = moves.map((moveNotation, idx) => 
      explainMove(moveNotation, idx, totalMoves)
    );

    return {
      success: true,
      isSolved: totalMoves === 0,
      totalMoves,
      solution: solutionString,
      moves,
      steps,
      faceletString: strRepresentation
    };
  } catch (error) {
    console.error('[KociembaSolver] Error resolviendo cubo:', error);
    return {
      success: false,
      isSolved: false,
      error: error.message || 'Error procesando la configuración del cubo. Verifica que los colores no tengan piezas imposibles.'
    };
  }
}

/**
 * Invierte un movimiento de notación canónica (ej. R -> R', U' -> U, D2 -> D2)
 */
export function invertMove(move) {
  if (!move) return '';
  const clean = move.trim().toUpperCase();
  const face = clean[0];
  const mod = clean.slice(1);
  if (mod === "'") return face;
  if (mod === '2') return face + '2';
  return face + "'";
}

/**
 * Evalúa un giro físico frente al esperado en el resolvedor interactivo
 */
export function evaluateUserMove(expectedNotation, performedMove) {
  const exp = (expectedNotation || '').trim().toUpperCase();
  const perf = (performedMove || '').trim().toUpperCase();

  if (!exp || !perf) return { isCorrect: false };

  const expFace = exp[0];
  const expMod = exp.slice(1);

  const perfFace = perf[0];
  const perfMod = perf.slice(1);

  // Caso 1: Movimiento 180° (ej. D2)
  if (expMod === '2') {
    if (perfFace === expFace) {
      return {
        isCorrect: true,
        isHalfTurn: true,
        face: expFace,
        explanation: '¡1 de 2 giros listo! Gira una vez más la misma cara.'
      };
    }
  }

  // Caso 2: Movimiento simple 90° exacto
  if (exp === perf) {
    return {
      isCorrect: true,
      isHalfTurn: false,
      face: expFace,
      explanation: '¡Giro exacto!'
    };
  }

  // Caso 3: Misma cara, pero sentido contrario (ej. esperado U, hizo U')
  if (perfFace === expFace) {
    return {
      isCorrect: false,
      isSameFaceWrongDirection: true,
      wrongFace: perfFace,
      correctionNotation: expFace + '2',
      correctionHuman: `Gira la cara ${CUBE_COLORS[perfFace]?.name || perfFace} dos veces para compensar.`,
      undoNotation: invertMove(perf),
      message: `Giraste la cara ${CUBE_COLORS[perfFace]?.name || perfFace} al revés.`
    };
  }

  // Caso 4: Cara equivocada (ej. esperado D, movió R)
  return {
    isCorrect: false,
    isWrongFace: true,
    wrongFace: perfFace,
    undoNotation: invertMove(perf),
    correctionHuman: `Gira la cara ${CUBE_COLORS[perfFace]?.name || perfFace} en sentido contrario para deshacer.`,
    message: `Giraste la cara ${CUBE_COLORS[perfFace]?.name || perfFace} en vez de ${CUBE_COLORS[expFace]?.name || expFace}.`
  };
}

/**
 * Sonidos sintetizados instantáneos vía Web Audio API (Cero latencia, sin archivos de audio)
 */
export function playSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Re
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.06); // La
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.20);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.21);
  } catch (_) {}
}

export function playErrorAlert() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (_) {}
}

