-- ==============================================================================
-- SEED INSTITUCIONAL: COGNIMIRROR RESEARCH LAB (ENTORNO DE PRUEBAS Y VALIDACIÓN)
-- ==============================================================================

-- 0. Asegurar extensiones y columnas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.colegios 
ADD COLUMN IF NOT EXISTS comuna VARCHAR(100) DEFAULT 'Santiago',
ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT 'Metropolitana',
ADD COLUMN IF NOT EXISTS codigo_invitacion VARCHAR(20);

ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES public.colegios(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS cargo_texto VARCHAR(100),
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 1. Eliminar la restricción conflictiva previa de roles
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- 2. Normalizar cualquier fila existente con roles antiguos
UPDATE public.perfiles 
SET rol = LOWER(COALESCE(rol, 'especialista'));

UPDATE public.perfiles 
SET rol = 'especialista' 
WHERE rol NOT IN ('director', 'coordinador_pie', 'psicologo', 'terapeuta', 'especialista', 'evaluador');

-- 3. Tabla de auditoría
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID REFERENCES public.colegios(id) ON DELETE CASCADE,
    usuario_id UUID,
    usuario_nombre VARCHAR(150),
    evento VARCHAR(50) NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    ip_origen VARCHAR(45),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Insertar el Colegio Oficial de Pruebas (CogniMirror Research Lab)
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

-- 5. Insertar Perfil Director / Administrador
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

-- 6. Insertar Perfil Evaluador (Para las 200 pruebas del cubo)
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

-- 7. Registrar evento de auditoría inicial
INSERT INTO public.logs_auditoria (colegio_id, usuario_nombre, evento, detalles)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Sistema Central',
  'CREAR_USUARIO',
  '{"accion": "Inicializacion de entorno de validacion clinica CogniMirror Lab (200 pruebas)"}'::jsonb
);
