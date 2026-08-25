-- ==============================================================================
-- SEED INSTITUCIONAL: COGNIMIRROR RESEARCH LAB (ENTORNO DE PRUEBAS Y VALIDACIÓN)
-- ==============================================================================
-- Este script crea el colegio "CogniMirror Research & Validation Lab" (RBD: 99999-9)
-- y los usuarios oficiales del equipo para aplicar las 200 pruebas clínicas/BLE.
-- ==============================================================================

-- 1. Insertar el Colegio de Pruebas Oficial (Tenant de I+D)
INSERT INTO public.colegios (id, nombre, rbd, comuna, region)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'CogniMirror Research Lab (Entorno de Pruebas)',
  '99999-9',
  'Santiago',
  'Metropolitana'
)
ON CONFLICT (rbd) DO UPDATE 
SET nombre = EXCLUDED.nombre;

-- 2. Insertar Perfil Director / Administrador (Equipo CogniMirror)
INSERT INTO public.perfiles (id, colegio_id, email, nombre_completo, rol, cargo_texto, activo)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'cognimirrorspa@gmail.com',
  'Equipo CogniMirror (Administración & I+D)',
  'director',
  'Director de Investigación y Desarrollo',
  TRUE
)
ON CONFLICT (id) DO UPDATE 
SET colegio_id = EXCLUDED.colegio_id, rol = EXCLUDED.rol;

-- 3. Insertar Perfil Evaluador Clínico (Para aplicar los 200 Tests con el Cubo)
INSERT INTO public.perfiles (id, colegio_id, email, nombre_completo, rol, cargo_texto, activo)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'evaluador@cognimirror.cl',
  'Ps. Evaluador de Investigación (200 Tests)',
  'psicologo',
  'Psicólogo Investigador / Evaluador BLE',
  TRUE
)
ON CONFLICT (id) DO UPDATE 
SET colegio_id = EXCLUDED.colegio_id, rol = EXCLUDED.rol;

-- 4. Registro de Auditoría Inicial
INSERT INTO public.logs_auditoria (colegio_id, usuario_nombre, evento, detalles)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Sistema Central',
  'CREAR_USUARIO',
  '{"accion": "Inicializacion de entorno de validacion clinica CogniMirror Lab (200 pruebas)"}'::jsonb
);
