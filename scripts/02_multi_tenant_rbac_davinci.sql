-- ==============================================================================
-- COGNIMIRROR: ESQUEMA MULTI-TENANT CON CONTROL DE ACCESO BASADO EN ROLES (RBAC)
-- Y AUDITORÍA DE SEGURIDAD (POSTGRESQL / SUPABASE)
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Definición de Tipos ENUM
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('DIRECTOR', 'COORDINADOR_PIE', 'PSICOLOGO', 'TERAPEUTA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_evento_auditoria AS ENUM (
        'LOGIN', 
        'LOGOUT', 
        'CREAR_USUARIO', 
        'DESACTIVAR_USUARIO', 
        'CREAR_ESTUDIANTE', 
        'ACTUALIZAR_ESTUDIANTE',
        'EVALUACION_COMPLETA',
        'EXPORTAR_DATOS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla de Instituciones (Colegios / Tenants)
CREATE TABLE IF NOT EXISTS colegios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    rbd VARCHAR(50) UNIQUE NOT NULL,
    comuna VARCHAR(100) DEFAULT 'Santiago',
    region VARCHAR(100) DEFAULT 'Metropolitana',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Usuarios / Profesionales
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'PSICOLOGO',
    cargo_texto VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Estudiantes (Pertenencia institucional y clínica PIE)
CREATE TABLE IF NOT EXISTS estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
    run VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    curso VARCHAR(50) NOT NULL,
    diagnostico_pie VARCHAR(100) DEFAULT 'TDAH', -- TEA, TDAH, DEA, FIL, etc.
    activo BOOLEAN DEFAULT TRUE,
    observaciones_clinicas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de Sesiones y Evaluaciones Clínicas (Telemetría de Cubo Inteligente)
CREATE TABLE IF NOT EXISTS sesiones_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    profesional_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_test VARCHAR(50) NOT NULL, -- 'Reaction Mirror', 'Memory Mirror (Corsi)', etc.
    latencia_ms INTEGER,
    puntaje INTEGER DEFAULT 0,
    aciertos INTEGER DEFAULT 0,
    errores INTEGER DEFAULT 0,
    observaciones TEXT,
    metricas_completas JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla de Auditoría y Trazabilidad (Logs Inmutables para cumplimiento normativo)
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(100),
    evento tipo_evento_auditoria NOT NULL,
    ip_origen VARCHAR(45) DEFAULT '192.168.1.1',
    detalles JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- POLÍTICAS DE AISLAMIENTO MULTI-TENANT (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Lectura de colegios para usuarios autenticados
CREATE POLICY "RLS_Colegios_Lectura" ON colegios
    FOR SELECT TO authenticated USING (true);

-- Aislamiento estricto por colegio_id en usuarios
CREATE POLICY "RLS_Usuarios_Tenant" ON usuarios
    FOR ALL TO authenticated
    USING (colegio_id = (SELECT colegio_id FROM usuarios WHERE id = auth.uid()));

-- Aislamiento de estudiantes por colegio
CREATE POLICY "RLS_Estudiantes_Tenant" ON estudiantes
    FOR ALL TO authenticated
    USING (colegio_id = (SELECT colegio_id FROM usuarios WHERE id = auth.uid()));

-- Aislamiento de sesiones clínicas
CREATE POLICY "RLS_Sesiones_Tenant" ON sesiones_clinicas
    FOR ALL TO authenticated
    USING (colegio_id = (SELECT colegio_id FROM usuarios WHERE id = auth.uid()));

-- Aislamiento de auditoría (Directores y Coordinadores leen logs del colegio)
CREATE POLICY "RLS_Logs_Tenant" ON logs_auditoria
    FOR SELECT TO authenticated
    USING (
        colegio_id = (SELECT colegio_id FROM usuarios WHERE id = auth.uid())
        AND (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('DIRECTOR', 'COORDINADOR_PIE')
    );

-- ==============================================================================
-- DATOS SEMILLA PARA LA DEMOSTRACIÓN DEL COLEGIO LEONARDO DA VINCI
-- ==============================================================================

-- 1. Insertar Colegio Leonardo Da Vinci
INSERT INTO colegios (id, nombre, rbd, comuna, region)
VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'Colegio Leonardo Da Vinci',
    '12345-6',
    'Las Condes',
    'Región Metropolitana'
) ON CONFLICT (rbd) DO NOTHING;

-- 2. Insertar Equipo Profesional
INSERT INTO usuarios (id, colegio_id, nombre, email, rol, cargo_texto, activo, ultimo_acceso)
VALUES
    ('u1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Andrés Soto', 'director@davinci.cl', 'DIRECTOR', 'Director Académico', true, NOW() - INTERVAL '15 minutes'),
    ('u1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Matias Fierro', 'mfierro@davinci.cl', 'PSICOLOGO', 'Psicólogo PIE', true, NOW() - INTERVAL '45 minutes'),
    ('u1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Nicole Mancilla', 'nmancilla@davinci.cl', 'TERAPEUTA', 'Terapeuta Ocupacional', true, NOW() - INTERVAL '3 hours'),
    ('u1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Camila Valenzuela', 'cvalenzuela@davinci.cl', 'COORDINADOR_PIE', 'Coordinadora PIE General', true, NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;

-- 3. Insertar Muestra de Estudiantes PIE
INSERT INTO estudiantes (id, colegio_id, run, nombre, curso, diagnostico_pie, activo)
VALUES
    ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '24.112.334-1', 'Lucas Morales V.', '4° Básico A', 'TDAH', true),
    ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', '24.890.123-5', 'Sofía Contreras P.', '3° Básico B', 'TEA Grado 1', true),
    ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', '23.456.789-K', 'Benjamín Silva R.', '5° Básico A', 'DEA Lectoescritura', true),
    ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', '24.345.678-9', 'Martina Espinoza L.', '4° Básico B', 'Funcionamiento Intelectual Límite', true)
ON CONFLICT DO NOTHING;

-- 4. Insertar Logs de Auditoría
INSERT INTO logs_auditoria (colegio_id, usuario_id, usuario_nombre, evento, ip_origen, detalles, created_at)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000002', 'Matias Fierro', 'LOGIN', '190.161.44.12', '{"modulo": "Autenticación", "navegador": "Chrome 122"}'::jsonb, NOW() - INTERVAL '45 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000002', 'Matias Fierro', 'EVALUACION_COMPLETA', '190.161.44.12', '{"estudiante": "Lucas Morales V.", "test": "Memory Mirror", "span": 5}'::jsonb, NOW() - INTERVAL '30 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', 'Nicole Mancilla', 'LOGIN', '201.218.89.50', '{"modulo": "Autenticación", "navegador": "Safari 17"}'::jsonb, NOW() - INTERVAL '3 hours'),
    ('c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', 'Nicole Mancilla', 'EVALUACION_COMPLETA', '201.218.89.50', '{"estudiante": "Sofía Contreras P.", "test": "Reaction Mirror", "latencia_ms": 420}'::jsonb, NOW() - INTERVAL '2 hours 15 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', 'Nicole Mancilla', 'LOGOUT', '201.218.89.50', '{"cierre_automatico": false}'::jsonb, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;
