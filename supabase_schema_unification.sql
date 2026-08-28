-- ============================================================================
-- COGNIMIRROR 2.0 - ESQUEMA RELACIONAL NORMALIZADO & EVENT SOURCING (PRODUCCIÓN)
-- Base de Datos: viqtdxvoryovilzsfhwu (BD 2 - Principal)
-- ============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLA: INSTITUCIONES (Colegios, Centros Terapéuticos y Founders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instituciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'colegio',
    email TEXT UNIQUE NOT NULL,
    codigo TEXT,
    telefono TEXT,
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Limpiar constraints viejas de instituciones y asegurar columnas
ALTER TABLE public.instituciones DROP CONSTRAINT IF EXISTS instituciones_tipo_check;
ALTER TABLE public.instituciones
    ADD COLUMN IF NOT EXISTS nombre TEXT,
    ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'colegio',
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS codigo TEXT,
    ADD COLUMN IF NOT EXISTS telefono TEXT,
    ADD COLUMN IF NOT EXISTS direccion TEXT,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.instituciones 
    ADD CONSTRAINT instituciones_tipo_check 
    CHECK (tipo IN ('colegio', 'centro_terapeutico', 'clinica', 'founders'));

-- Insertar la Institución Matriz / Founders
INSERT INTO public.instituciones (id, nombre, tipo, email, codigo, activo)
VALUES (
    'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08',
    'Colegio CogniMirror (Founders & Tests)',
    'founders',
    'cognimirrorspa@gmail.com',
    'COG-FOUNDERS-01',
    TRUE
)
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre, email = EXCLUDED.email, tipo = EXCLUDED.tipo;

-- ============================================================================
-- 2. TABLA: PERFILES (Founders, Directores, Profesionales de la Salud)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT,
    nombre TEXT,
    apellido TEXT DEFAULT '',
    telefono TEXT,
    rol TEXT DEFAULT 'profesional',
    especialidad TEXT,
    institucion_id UUID REFERENCES public.instituciones(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Eliminar restricciones viejas de FK que bloqueaban el ID contra auth.users
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_id_fkey;
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_user_id_fkey;
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_especialidad_check;

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.perfiles
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS nombre TEXT,
    ADD COLUMN IF NOT EXISTS apellido TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS telefono TEXT,
    ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'profesional',
    ADD COLUMN IF NOT EXISTS especialidad TEXT,
    ADD COLUMN IF NOT EXISTS institucion_id UUID REFERENCES public.instituciones(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

-- Nueva restricción de roles actualizada
ALTER TABLE public.perfiles 
    ADD CONSTRAINT perfiles_rol_check 
    CHECK (rol IN ('founder', 'director', 'profesional', 'terapeuta', 'institucional', 'admin'));

-- Insertar Perfiles Base / Psicólogos de Referencia
INSERT INTO public.perfiles (id, email, nombre, apellido, rol, especialidad, institucion_id)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'admin@cognimirror.com', 'Admin / Founder', 'CogniMirror', 'founder', 'investigador', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08'),
    ('cf2b7f81-05f0-462a-9d75-c27953771030', 'psicologo1@cognimirror.com', 'Especialista', 'Neurocognitivo 1', 'profesional', 'psicologo', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08'),
    ('23d37185-65c9-4c0e-a67b-c076b3bc5b97', 'psicologo2@cognimirror.com', 'Especialista', 'Neurocognitivo 2', 'profesional', 'psicologo', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08'),
    ('d543ad6f-13df-4d8c-9417-2f69554fe238', 'terapeuta@cognimirror.com', 'Terapeuta', 'Ocupacional', 'profesional', 'terapeuta_ocupacional', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08')
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre, email = EXCLUDED.email, rol = EXCLUDED.rol, institucion_id = EXCLUDED.institucion_id;

-- ============================================================================
-- 3. TABLA: CURSOS (Específica para Colegios y Cierre de Año Escolar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    nivel TEXT NOT NULL,
    letra TEXT NOT NULL,
    anio_academico INT NOT NULL,
    nombre_completo TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (institucion_id, nivel, letra, anio_academico)
);

ALTER TABLE public.cursos
    ADD COLUMN IF NOT EXISTS institucion_id UUID REFERENCES public.instituciones(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS nivel TEXT,
    ADD COLUMN IF NOT EXISTS letra TEXT,
    ADD COLUMN IF NOT EXISTS anio_academico INT,
    ADD COLUMN IF NOT EXISTS nombre_completo TEXT,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- 4. TABLA: PACIENTES (Ficha Universal sin grupo_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    apellido TEXT DEFAULT '',
    id_sujeto TEXT,
    run TEXT,
    fecha_nacimiento DATE,
    genero TEXT,
    diagnostico_principal TEXT,
    diagnosticos_secundarios TEXT[],
    historial_clinico JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Limpiar constraints viejas de pacientes
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_id_fkey;
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_id_psicologo_fkey;
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_psicologo_id_fkey;

-- Asegurar columnas requeridas en pacientes
ALTER TABLE public.pacientes
    ADD COLUMN IF NOT EXISTS institucion_id UUID REFERENCES public.instituciones(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS nombre TEXT,
    ADD COLUMN IF NOT EXISTS apellido TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS id_sujeto TEXT,
    ADD COLUMN IF NOT EXISTS run TEXT,
    ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
    ADD COLUMN IF NOT EXISTS genero TEXT,
    ADD COLUMN IF NOT EXISTS diagnostico_principal TEXT,
    ADD COLUMN IF NOT EXISTS diagnosticos_secundarios TEXT[],
    ADD COLUMN IF NOT EXISTS historial_clinico JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

-- Eliminar columnas antiguas si existían
ALTER TABLE public.pacientes DROP COLUMN IF EXISTS grupo_id;
ALTER TABLE public.pacientes DROP COLUMN IF EXISTS id_psicologo;

-- ============================================================================
-- 5. TABLA: ASIGNACIONES PROFESIONAL - PACIENTE (Relación N a N)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asignaciones_profesional_paciente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    profesional_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    rol_en_caso TEXT DEFAULT 'principal',
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE (paciente_id, profesional_id)
);

-- ============================================================================
-- 6. TABLA: SESIONES_EVALUACION (Cabecera General de la Batería)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sesiones_evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    profesional_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
    
    protocolo_nivel INT NOT NULL,
    protocolo_nombre TEXT NOT NULL,
    
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    duracion_total_segundos INT,
    estado TEXT DEFAULT 'completado',
    
    ble_conectado BOOLEAN DEFAULT TRUE,
    ble_dispositivo_id TEXT,
    ble_bateria_nivel INT,
    
    observaciones_clinicas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABLA: TELEMETRIA_ENSAYOS (Telemetría Cruda Fila a Fila)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.telemetria_ensayos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID NOT NULL REFERENCES public.sesiones_evaluacion(id) ON DELETE CASCADE,
    
    ensayo_num INT NOT NULL,
    fase_o_bloque INT DEFAULT 1,
    
    tipo_estimulo TEXT NOT NULL,
    color_estimulo TEXT,
    cara_esperada TEXT,
    
    timestamp_estimulo_ms BIGINT NOT NULL,
    timestamp_respuesta_ms BIGINT,
    latencia_ms INT,
    
    cara_presionada TEXT,
    mano_utilizada TEXT,
    giroscopio_datos JSONB,
    
    es_acierto BOOLEAN NOT NULL,
    tipo_error TEXT,
    
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetria_sesion_ensayo ON public.telemetria_ensayos(sesion_id, ensayo_num);

-- ============================================================================
-- 8. TABLA: TRAZABILIDAD_AUDITORIA (Historial Inmutable / Compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trazabilidad_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID REFERENCES public.instituciones(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    usuario_email TEXT NOT NULL,
    usuario_rol TEXT NOT NULL,
    
    accion TEXT NOT NULL,
    entidad_afectada TEXT,
    entidad_id UUID,
    
    detalles JSONB DEFAULT '{}'::jsonb,
    ip_origen TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger de Inmutabilidad
CREATE OR REPLACE FUNCTION public.proteger_trazabilidad_inmutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'La tabla trazabilidad_auditoria es INMUTABLE. No se permite MODIFICAR ni ELIMINAR registros.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trazabilidad_inmutable ON public.trazabilidad_auditoria;
CREATE TRIGGER trg_trazabilidad_inmutable
BEFORE UPDATE OR DELETE ON public.trazabilidad_auditoria
FOR EACH ROW EXECUTE FUNCTION public.proteger_trazabilidad_inmutable();

-- ============================================================================
-- 9. VISTAS SQL: CÁLCULO DINÁMICO DE MÉTRICAS DESDE LA TELEMETRÍA CRUDA
-- ============================================================================

-- Vista: Go / No-Go (Protocolo 2)
CREATE OR REPLACE VIEW public.v_metricas_gonogo AS
SELECT 
    s.id AS sesion_id,
    s.paciente_id,
    s.institucion_id,
    s.profesional_id,
    s.fecha_inicio,
    COUNT(t.id) AS total_ensayos,
    COUNT(CASE WHEN t.tipo_estimulo = 'GO' AND t.es_acierto THEN 1 END) AS aciertos_go,
    COUNT(CASE WHEN t.tipo_estimulo = 'NO_GO' AND NOT t.es_acierto THEN 1 END) AS errores_comision_no_go,
    COUNT(CASE WHEN t.tipo_estimulo = 'GO' AND NOT t.es_acierto THEN 1 END) AS errores_omision_go,
    ROUND(AVG(CASE WHEN t.tipo_estimulo = 'GO' AND t.es_acierto THEN t.latencia_ms END), 2) AS latencia_motriz_media_ms,
    ROUND(
        (COUNT(CASE WHEN t.tipo_estimulo = 'NO_GO' AND t.es_acierto THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(CASE WHEN t.tipo_estimulo = 'NO_GO' THEN 1 END), 0)) * 100, 2
    ) AS porcentaje_freno_inhibitorio
FROM public.sesiones_evaluacion s
JOIN public.telemetria_ensayos t ON t.sesion_id = s.id
WHERE s.protocolo_nombre = 'p02_go_no_go'
GROUP BY s.id, s.paciente_id, s.institucion_id, s.profesional_id, s.fecha_inicio;

-- Vista: Bilateralidad y Alternancia Motora (Protocolo 3)
CREATE OR REPLACE VIEW public.v_metricas_bilateralidad AS
SELECT 
    s.id AS sesion_id,
    s.paciente_id,
    s.institucion_id,
    s.fecha_inicio,
    COUNT(t.id) AS total_ensayos,
    ROUND(AVG(CASE WHEN t.mano_utilizada = 'izquierda' AND t.es_acierto THEN t.latencia_ms END), 2) AS latencia_mano_izquierda_ms,
    ROUND(AVG(CASE WHEN t.mano_utilizada = 'derecha' AND t.es_acierto THEN t.latencia_ms END), 2) AS latencia_mano_derecha_ms,
    ROUND(ABS(
        AVG(CASE WHEN t.mano_utilizada = 'derecha' AND t.es_acierto THEN t.latencia_ms END) -
        AVG(CASE WHEN t.mano_utilizada = 'izquierda' AND t.es_acierto THEN t.latencia_ms END)
    ), 2) AS indice_asimetria_hemisferica_ms,
    ROUND(STDDEV_POP(t.latencia_ms), 2) AS consistencia_ritmo_sd
FROM public.sesiones_evaluacion s
JOIN public.telemetria_ensayos t ON t.sesion_id = s.id
WHERE s.protocolo_nombre = 'p03_bilateralidad'
GROUP BY s.id, s.paciente_id, s.institucion_id, s.fecha_inicio;

-- Vista: Reaction Mirror / Informe PIE (Protocolo 4)
CREATE OR REPLACE VIEW public.v_metricas_reaction_pie AS
SELECT 
    s.id AS sesion_id,
    s.paciente_id,
    s.institucion_id,
    s.profesional_id,
    s.fecha_inicio,
    COUNT(t.id) AS total_ensayos,
    ROUND(AVG(CASE WHEN t.es_acierto THEN t.latencia_ms END), 2) AS latencia_media_ms,
    ROUND(STDDEV_POP(CASE WHEN t.es_acierto THEN t.latencia_ms END), 2) AS desviacion_estandar_sd,
    MIN(CASE WHEN t.es_acierto THEN t.latencia_ms END) AS latencia_minima_ms,
    MAX(CASE WHEN t.es_acierto THEN t.latencia_ms END) AS latencia_maxima_ms,
    ROUND((COUNT(CASE WHEN t.es_acierto THEN 1 END)::NUMERIC / NULLIF(COUNT(t.id), 0)) * 100, 2) AS precision_global_porcentaje
FROM public.sesiones_evaluacion s
JOIN public.telemetria_ensayos t ON t.sesion_id = s.id
WHERE s.protocolo_nombre = 'p04_reaction_mirror'
GROUP BY s.id, s.paciente_id, s.institucion_id, s.profesional_id, s.fecha_inicio;

-- Vista: Memory Mirror / Corsi 3D (Protocolo 5)
CREATE OR REPLACE VIEW public.v_metricas_memory_corsi AS
SELECT 
    s.id AS sesion_id,
    s.paciente_id,
    s.institucion_id,
    s.fecha_inicio,
    MAX(CASE WHEN t.es_acierto THEN t.fase_o_bloque ELSE 0 END) AS corsi_span_maximo,
    COUNT(t.id) AS total_ensayos,
    COUNT(CASE WHEN t.es_acierto THEN 1 END) AS ensayos_correctos,
    ROUND(AVG(t.latencia_ms), 2) AS latencia_intra_bloque_media_ms
FROM public.sesiones_evaluacion s
JOIN public.telemetria_ensayos t ON t.sesion_id = s.id
WHERE s.protocolo_nombre = 'p05_memory_mirror'
GROUP BY s.id, s.paciente_id, s.institucion_id, s.fecha_inicio;

-- ============================================================================
-- 10. LIMPIEZA Y MIGRACIÓN DE DATOS UNIFICADOS
-- ============================================================================

-- Limpiar basura antigua
DELETE FROM public.pacientes 
WHERE nombre ILIKE 'bra' 
   OR (nombre ILIKE 'brayan' AND creado_en < '2026-06-01' AND id_sujeto IS NULL);

-- Insertar Pacientes Limpios (Todos vinculados a la institución Founders)
INSERT INTO public.pacientes (id, nombre, apellido, id_sujeto, creado_en, institucion_id, activo, historial_clinico)
VALUES
  -- Pacientes de BD 2 limpios
  ('82716a98-6165-47af-8d06-fb2ef15bcd0c', 'Brayan', '', 'S-00', '2026-05-27T18:46:54+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('14382acd-889d-4d9b-9da5-292af49f32b5', 'Nicole', '', 'NICOLE-01', '2026-05-28T17:47:32+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('11239ab1-98e6-447f-b094-58123b4f2774', 'Jesús', '', 'JESUS-01', '2026-05-28T17:53:41+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('33a3b561-6b8a-44b5-99ff-e1fb8a7c4dbc', 'Andrés', '', 'ANDRES-01', '2026-05-28T19:53:17+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('50a47bf2-aebe-4c9b-a53a-5fa17622b826', 'Pedro', '', 'PEDRO-01', '2026-05-28T21:32:14+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('3b93a2f2-0eda-4e3d-90d7-079dfc5d251b', 'Sujeto S-01', '', 'S-01', '2026-06-12T14:56:37+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('1c8c969b-d7f5-46a5-8e35-5f3cd731326d', 'Sujeto S-02', '', 'S-02', '2026-06-12T22:30:38+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),

  -- Pacientes de BD 1 a unificar
  ('7640d167-4d64-4cc1-83fc-389ca76bfdc3', 'Juan', 'Pérez', 'S-03', '2026-06-25T18:05:40+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('540bd9bc-caa2-42ff-abc6-03d53416383b', 'María', 'González', 'S-04', '2026-06-25T18:05:43+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('93d7c1ed-13b5-41a4-86ad-eeca8120fe95', 'Carlos', 'Muñoz', 'S-05', '2026-06-25T18:05:46+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('41bd6c82-bd8d-4aa5-b289-209ec2b9c3a6', 'Brandon', '', 'BRANDON-01', '2026-07-06T04:29:20+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('dbdd8ea7-e7cf-476e-aa83-374e635ed08a', 'Armonía', '', 'ARMONIA-01', '2026-07-06T07:59:09+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('b5d3ea9a-d7f0-4d24-9532-ba59796e3013', 'Dami', '', 'DAMI-01', '2026-07-06T20:01:44+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('12349b0f-970f-4040-be17-44555f137e7a', 'Isa', '', 'ISA-01', '2026-07-06T20:41:13+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('6b9a8c21-6cf9-4559-828d-5c5365525487', 'Ítalo', '', 'ITALO-01', '2026-08-01T16:00:59+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('06e4906b-3328-41ad-9813-07d38c52f199', 'Cris', '', 'CRIS-01', '2026-08-01T16:57:55+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('6b13781d-b3a2-4c40-be58-4a97137a6674', 'Nicolás', '', 'NICOLAS-01', '2026-08-01T17:20:42+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('9adde719-d7bf-44af-98e7-318f9b5e772c', 'Tamara', '', 'TAMARA-01', '2026-08-06T16:54:34+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('bbd6c3d7-0db0-4e5b-ab3a-81f598df8ba6', 'Lendro', '', 'LENDRO-01', '2026-08-06T17:12:25+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb),
  ('53ab9421-4cf8-490d-9bbc-27acc480e401', 'Yohan', '', 'YOHAN-01', '2026-08-06T17:31:38+00:00', 'd70a4c28-98e3-4c9b-8d07-ee2c2a3cef08', true, '[]'::jsonb)
ON CONFLICT (id) DO UPDATE
SET 
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    id_sujeto = EXCLUDED.id_sujeto,
    institucion_id = EXCLUDED.institucion_id,
    activo = EXCLUDED.activo;

-- Asignar los pacientes a los especialistas correspondientes
INSERT INTO public.asignaciones_profesional_paciente (paciente_id, profesional_id, rol_en_caso)
SELECT p.id, 'cf2b7f81-05f0-462a-9d75-c27953771030'::uuid, 'principal'
FROM public.pacientes p
WHERE p.nombre IN ('Armonía', 'Dami', 'Isa')
ON CONFLICT (paciente_id, profesional_id) DO NOTHING;

INSERT INTO public.asignaciones_profesional_paciente (paciente_id, profesional_id, rol_en_caso)
SELECT p.id, '23d37185-65c9-4c0e-a67b-c076b3bc5b97'::uuid, 'principal'
FROM public.pacientes p
WHERE p.nombre IN ('Brandon', 'Ítalo', 'Cris', 'Nicolás', 'Tamara', 'Lendro', 'Yohan')
ON CONFLICT (paciente_id, profesional_id) DO NOTHING;

-- ============================================================================
-- 11. POLÍTICAS DE SEGURIDAD RLS
-- ============================================================================
ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_profesional_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetria_ensayos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trazabilidad_auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas iniciales para el frontend
DROP POLICY IF EXISTS "Acceso total a instituciones" ON public.instituciones;
CREATE POLICY "Acceso total a instituciones" ON public.instituciones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a perfiles" ON public.perfiles;
CREATE POLICY "Acceso total a perfiles" ON public.perfiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a cursos" ON public.cursos;
CREATE POLICY "Acceso total a cursos" ON public.cursos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a pacientes" ON public.pacientes;
CREATE POLICY "Acceso total a pacientes" ON public.pacientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a asignaciones" ON public.asignaciones_profesional_paciente;
CREATE POLICY "Acceso total a asignaciones" ON public.asignaciones_profesional_paciente FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a sesiones" ON public.sesiones_evaluacion;
CREATE POLICY "Acceso total a sesiones" ON public.sesiones_evaluacion FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a telemetria" ON public.telemetria_ensayos;
CREATE POLICY "Acceso total a telemetria" ON public.telemetria_ensayos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura e insercion a trazabilidad" ON public.trazabilidad_auditoria;
CREATE POLICY "Lectura e insercion a trazabilidad" ON public.trazabilidad_auditoria FOR SELECT USING (true);
CREATE POLICY "Insercion de trazabilidad" ON public.trazabilidad_auditoria FOR INSERT WITH CHECK (true);
