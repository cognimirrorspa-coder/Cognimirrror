-- 1. Crear tabla de Colegios (Tenant/Organización)
CREATE TABLE IF NOT EXISTS colegios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rbd TEXT UNIQUE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en Colegios
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;

-- 2. Actualizar tabla de Usuarios/Perfiles
ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES colegios(id),
ADD COLUMN IF NOT EXISTS rol TEXT CHECK (rol IN ('coordinador_pie', 'especialista'));

-- Habilitar RLS en Perfiles si no estaba habilitado
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- 3. Actualizar tabla de Pacientes (Estudiantes en el frontend)
-- Conservamos psicologo_id para trazabilidad
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES colegios(id),
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS diagnostico_nee TEXT, -- Ej: TDAH, TEA, Funcionamiento Límite
ADD COLUMN IF NOT EXISTS historial_clinico JSONB DEFAULT '[]'::jsonb;

-- Habilitar RLS en Pacientes
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- 4. Actualizar Sesiones Clínicas
ALTER TABLE sesiones_clinicas
ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES colegios(id),
ADD COLUMN IF NOT EXISTS especialista_id UUID REFERENCES perfiles(id);

-- Habilitar RLS en Sesiones Clínicas
ALTER TABLE sesiones_clinicas ENABLE ROW LEVEL SECURITY;

-- 5. Inserción de Colegio Piloto Demostración para datos históricos y bypass
INSERT INTO colegios (id, nombre, rbd) 
VALUES ('d70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', 'Colegio Piloto Demostración', '99999-9')
ON CONFLICT (rbd) DO NOTHING;

-- 6. Migración de Datos Históricos
-- Asignar el colegio piloto a todos los perfiles existentes
UPDATE perfiles 
SET colegio_id = 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08' 
WHERE colegio_id IS NULL;

-- Asignar el rol 'especialista' por defecto a perfiles sin rol
UPDATE perfiles 
SET rol = 'especialista' 
WHERE rol IS NULL;

-- Asignar el colegio piloto a todos los pacientes existentes
UPDATE pacientes 
SET colegio_id = 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08' 
WHERE colegio_id IS NULL;

-- Asignar el colegio piloto a todas las sesiones clínicas existentes
UPDATE sesiones_clinicas 
SET colegio_id = 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08' 
WHERE colegio_id IS NULL;

-- Asignar el especialista_id basándonos en psicologo_id (si tiene formato uuid válido)
UPDATE sesiones_clinicas 
SET especialista_id = CAST(psicologo_id AS UUID)
WHERE especialista_id IS NULL 
  AND psicologo_id IS NOT NULL 
  AND psicologo_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 7. Reescritura y Configuración de Políticas RLS

-- A. Políticas para Colegios
DROP POLICY IF EXISTS "Permitir lectura de colegios a usuarios autenticados" ON colegios;
CREATE POLICY "Permitir lectura de colegios a usuarios autenticados" ON colegios
  FOR SELECT TO authenticated USING (true);

-- B. Políticas para Perfiles
DROP POLICY IF EXISTS "Permitir acceso a perfiles del mismo colegio" ON perfiles;
CREATE POLICY "Permitir acceso a perfiles del mismo colegio" ON perfiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Permitir a coordinadores invitar/eliminar perfiles" ON perfiles;
CREATE POLICY "Permitir a coordinadores invitar/eliminar perfiles" ON perfiles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()) AND
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'coordinador_pie'
  );

-- C. Políticas para Pacientes (Estudiantes)
DROP POLICY IF EXISTS "Permitir acceso a pacientes del psicologo" ON pacientes;
DROP POLICY IF EXISTS "Bypass anon lectura pacientes" ON pacientes;
DROP POLICY IF EXISTS "Bypass anon escritura pacientes" ON pacientes;
DROP POLICY IF EXISTS "Permitir acceso a pacientes por colegio_id" ON pacientes;

CREATE POLICY "Permitir acceso a pacientes por colegio_id" ON pacientes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()))
  WITH CHECK (colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()));

-- D. Políticas para Sesiones Clínicas
DROP POLICY IF EXISTS "Permitir acceso a sesiones del psicologo" ON sesiones_clinicas;
DROP POLICY IF EXISTS "Bypass anon lectura sesiones" ON sesiones_clinicas;
DROP POLICY IF EXISTS "Bypass anon escritura sesiones" ON sesiones_clinicas;
DROP POLICY IF EXISTS "Permitir acceso a sesiones por colegio_id" ON sesiones_clinicas;

CREATE POLICY "Permitir acceso a sesiones por colegio_id" ON sesiones_clinicas
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()) OR
    especialista_id = auth.uid()
  )
  WITH CHECK (
    colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()) OR
    especialista_id = auth.uid()
  );

-- E. Políticas para Resultados de Reacción
DROP POLICY IF EXISTS "Permitir acceso a resultados de reaccion del psicologo" ON resultados_juego_reaccion;
DROP POLICY IF EXISTS "Bypass anon lectura reaccion" ON resultados_juego_reaccion;
DROP POLICY IF EXISTS "Bypass anon escritura reaccion" ON resultados_juego_reaccion;
DROP POLICY IF EXISTS "Permitir acceso a resultados de reaccion por colegio_id" ON resultados_juego_reaccion;

CREATE POLICY "Permitir acceso a resultados de reaccion por colegio_id" ON resultados_juego_reaccion
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sesiones_clinicas
      WHERE sesiones_clinicas.id = resultados_juego_reaccion.id_sesion
        AND sesiones_clinicas.colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid())
    )
  );

-- F. Políticas para Resultados de Memoria
DROP POLICY IF EXISTS "Permitir acceso a resultados de memoria del psicologo" ON resultados_juego_memoria;
DROP POLICY IF EXISTS "Bypass anon lectura memoria" ON resultados_juego_memoria;
DROP POLICY IF EXISTS "Bypass anon escritura memoria" ON resultados_juego_memoria;
DROP POLICY IF EXISTS "Permitir acceso a resultados de memoria por colegio_id" ON resultados_juego_memoria;

CREATE POLICY "Permitir acceso a resultados de memoria por colegio_id" ON resultados_juego_memoria
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sesiones_clinicas
      WHERE sesiones_clinicas.id = resultados_juego_memoria.id_sesion
        AND sesiones_clinicas.colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid())
    )
  );
