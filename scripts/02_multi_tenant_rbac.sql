-- ==============================================================================
-- COGNIMIRROR: ESQUEMA MULTI-TENANT CON CONTROL DE ACCESO BASADO EN ROLES (RBAC)
-- Y AUDITORÍA DE SEGURIDAD GENERALIZADA (POSTGRESQL / SUPABASE)
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Instituciones (Colegios / Tenants)
-- Cada colegio representa un tenant completamente aislado en la base de datos
CREATE TABLE IF NOT EXISTS colegios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    rbd VARCHAR(50) UNIQUE NOT NULL,
    comuna VARCHAR(100) DEFAULT 'Santiago',
    region VARCHAR(100) DEFAULT 'Metropolitana',
    codigo_invitacion VARCHAR(20) UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla colegios ya existía previamente, asegurar columnas:
ALTER TABLE colegios 
ADD COLUMN IF NOT EXISTS comuna VARCHAR(100) DEFAULT 'Santiago',
ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT 'Metropolitana',
ADD COLUMN IF NOT EXISTS codigo_invitacion VARCHAR(20);

-- Habilitar RLS en Colegios
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;

-- 3. Tabla de Perfiles de Usuario (Directores, Psicólogos, Terapeutas, Coordinadores)
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY, -- Mapea a auth.users(id) en Supabase
    colegio_id UUID REFERENCES colegios(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'especialista' CHECK (rol IN ('director', 'coordinador_pie', 'psicologo', 'terapeuta', 'especialista')),
    cargo_texto VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla perfiles ya existía con columnas previas, aseguramos las nuevas columnas:
ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES colegios(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS cargo_texto VARCHAR(100),
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- 4. Tabla de Estudiantes / Pacientes PIE
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID REFERENCES colegios(id) ON DELETE CASCADE,
    psicologo_id UUID,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) DEFAULT '',
    run VARCHAR(20),
    curso VARCHAR(50),
    id_sujeto VARCHAR(50),
    grupo_id VARCHAR(50) DEFAULT 'pie_escolar',
    fecha_nacimiento DATE,
    diagnostico_nee VARCHAR(100), -- TDAH, TEA, DEA, FIL, etc.
    historial_clinico JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES colegios(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS run VARCHAR(20),
ADD COLUMN IF NOT EXISTS curso VARCHAR(50),
ADD COLUMN IF NOT EXISTS diagnostico_nee VARCHAR(100),
ADD COLUMN IF NOT EXISTS historial_clinico JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- 5. Tabla de Sesiones Clínicas y Telemetría de Cubo Inteligente
CREATE TABLE IF NOT EXISTS sesiones_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID REFERENCES colegios(id) ON DELETE CASCADE,
    id_paciente UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    especialista_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    psicologo_id TEXT,
    tipo_test VARCHAR(50) NOT NULL, -- 'Reaction Mirror', 'Memory Mirror (Corsi)', etc.
    intento_numero INTEGER DEFAULT 1,
    etiqueta_clinica VARCHAR(50),
    estadisticas_json JSONB DEFAULT '{}'::jsonb,
    etiqueta_estudio VARCHAR(100),
    id_sujeto VARCHAR(50),
    intento_valido BOOLEAN DEFAULT TRUE,
    fecha_sesion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE sesiones_clinicas 
ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES colegios(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS especialista_id UUID REFERENCES perfiles(id) ON DELETE SET NULL;

ALTER TABLE sesiones_clinicas ENABLE ROW LEVEL SECURITY;

-- 6. Tabla de Auditoría y Trazabilidad (Inmutable para cumplimiento Ley 19.628 / Decreto 170)
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
    usuario_id UUID,
    usuario_nombre VARCHAR(150),
    evento VARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'CREAR_USUARIO', 'DESACTIVAR_USUARIO', 'CREAR_ESTUDIANTE', 'EVALUACION_COMPLETA', 'EXPORTAR_DATOS'
    ip_origen VARCHAR(45) DEFAULT '127.0.0.1',
    detalles JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS DE AISLAMIENTO MULTI-TENANT (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- A. Colegios
DROP POLICY IF EXISTS "RLS_Colegios_Select" ON colegios;
CREATE POLICY "RLS_Colegios_Select" ON colegios
    FOR SELECT TO authenticated USING (true);

-- B. Perfiles (Los usuarios solo acceden a miembros de su mismo colegio)
DROP POLICY IF EXISTS "RLS_Perfiles_Tenant_Select" ON perfiles;
CREATE POLICY "RLS_Perfiles_Tenant_Select" ON perfiles
    FOR SELECT TO authenticated
    USING (colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "RLS_Perfiles_Tenant_Admin" ON perfiles;
CREATE POLICY "RLS_Perfiles_Tenant_Admin" ON perfiles
    FOR ALL TO authenticated
    USING (
        colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid())
        AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('director', 'coordinador_pie')
    );

-- C. Pacientes (Aislamiento por colegio)
DROP POLICY IF EXISTS "RLS_Pacientes_Tenant" ON pacientes;
CREATE POLICY "RLS_Pacientes_Tenant" ON pacientes
    FOR ALL TO authenticated
    USING (colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()));

-- D. Sesiones Clínicas
DROP POLICY IF EXISTS "RLS_Sesiones_Tenant" ON sesiones_clinicas;
CREATE POLICY "RLS_Sesiones_Tenant" ON sesiones_clinicas
    FOR ALL TO authenticated
    USING (colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()));

-- E. Auditoría (Solo Director y Coordinador leen los logs de su colegio)
DROP POLICY IF EXISTS "RLS_Logs_Tenant" ON logs_auditoria;
CREATE POLICY "RLS_Logs_Tenant" ON logs_auditoria
    FOR SELECT TO authenticated
    USING (
        colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid())
        AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('director', 'coordinador_pie')
    );

-- Permitir inserción de logs para cualquier usuario autenticado de ese colegio
DROP POLICY IF EXISTS "RLS_Logs_Insert" ON logs_auditoria;
CREATE POLICY "RLS_Logs_Insert" ON logs_auditoria
    FOR INSERT TO authenticated
    WITH CHECK (colegio_id = (SELECT colegio_id FROM perfiles WHERE id = auth.uid()));
