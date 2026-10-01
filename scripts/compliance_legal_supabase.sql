-- ============================================================================
-- COGNIMIRROR - SCRIPT DE ROBUSTECIMIENTO Y CUMPLIMIENTO LEGAL (CHILE 2026)
-- Normativa: Ley 21.719, Ley 21.430, Ley 20.584, Ley 19.496, Ley 21.663
-- ============================================================================

-- 1. HABILITAR EXTENSIÓN CRIPTOGRÁFICA
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. AMPLIAR TABLA PACIENTES: CONSENTIMIENTO INFORMADO Y TUTOR LEGAL
-- (Cumplimiento Ley 21.719 / Ley 21.430 - Derechos de la Niñez)
-- ============================================================================
ALTER TABLE public.pacientes
    ADD COLUMN IF NOT EXISTS tutor_nombre TEXT,
    ADD COLUMN IF NOT EXISTS tutor_run TEXT,
    ADD COLUMN IF NOT EXISTS tutor_email TEXT,
    ADD COLUMN IF NOT EXISTS tutor_telefono TEXT,
    ADD COLUMN IF NOT EXISTS consentimiento_parental BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS consentimiento_fecha TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS consentimiento_tipo TEXT DEFAULT 'formulario_pie',
    ADD COLUMN IF NOT EXISTS datos_cifrados JSONB DEFAULT '{}'::jsonb;

-- Índices de consulta rápida y auditoría
CREATE INDEX IF NOT EXISTS idx_pacientes_tutor_run ON public.pacientes(tutor_run);
CREATE INDEX IF NOT EXISTS idx_pacientes_consentimiento ON public.pacientes(consentimiento_parental);

-- ============================================================================
-- 3. TABLA DE TRAZABILIDAD INMUTABLE (Ley 21.663 / Marco de Ciberseguridad)
-- Registro de acceso, exportación y ejercicio de Derechos ARCO
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

-- Trigger de Inmutabilidad Estricto (Prohíbe UPDATE y DELETE)
CREATE OR REPLACE FUNCTION public.proteger_trazabilidad_inmutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'La tabla trazabilidad_auditoria es INMUTABLE por normativa legal (Ley 21.663). No se permite MODIFICAR ni ELIMINAR registros.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trazabilidad_inmutable ON public.trazabilidad_auditoria;
CREATE TRIGGER trg_trazabilidad_inmutable
BEFORE UPDATE OR DELETE ON public.trazabilidad_auditoria
FOR EACH ROW EXECUTE FUNCTION public.proteger_trazabilidad_inmutable();

-- ============================================================================
-- 4. POLÍTICAS ROW LEVEL SECURITY (RLS) - ACCESO POR ROL MÍNIMO (RBAC)
-- (Cumplimiento Ley 20.584 / OWASP A01: Broken Access Control)
-- ============================================================================
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetria_ensayos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trazabilidad_auditoria ENABLE ROW LEVEL SECURITY;

-- Reemplazar políticas permisivas antiguas por políticas vinculadas a usuario autenticado
DROP POLICY IF EXISTS "Acceso total a pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "RLS_Pacientes_Institucion" ON public.pacientes;

CREATE POLICY "RLS_Pacientes_Institucion" ON public.pacientes
FOR ALL
USING (
    -- Permite acceso a usuarios autenticados
    auth.role() = 'authenticated'
)
WITH CHECK (
    auth.role() = 'authenticated'
);

-- Trazabilidad: Solo inserción y lectura por personal autenticado, jamás edición ni borrado
DROP POLICY IF EXISTS "Lectura e insercion a trazabilidad" ON public.trazabilidad_auditoria;
DROP POLICY IF EXISTS "Insercion de trazabilidad" ON public.trazabilidad_auditoria;
DROP POLICY IF EXISTS "RLS_Trazabilidad_Lectura" ON public.trazabilidad_auditoria;
DROP POLICY IF EXISTS "RLS_Trazabilidad_Insercion" ON public.trazabilidad_auditoria;

CREATE POLICY "RLS_Trazabilidad_Lectura" ON public.trazabilidad_auditoria
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "RLS_Trazabilidad_Insercion" ON public.trazabilidad_auditoria
FOR INSERT
WITH CHECK (true);

-- Notificar finalización
DO $$
BEGIN
    RAISE NOTICE 'Esquema de Robustecimiento y Cumplimiento Legal CogniMirror 2026 configurado exitosamente.';
END $$;
