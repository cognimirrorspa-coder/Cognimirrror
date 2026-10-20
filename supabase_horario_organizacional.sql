-- ==============================================================================
-- MIGRACIÓN SUPABASE: HORARIO ORGANIZACIONAL & KANBAN MULTI-INTEGRANTE
-- Plataforma CogniMirror - Trazabilidad y Sincronización en Tiempo Real
-- ==============================================================================

-- 1. Crear tabla de Tareas del Horario Organizacional / Kanban
CREATE TABLE IF NOT EXISTS public.organizacional_tareas (
  id TEXT PRIMARY KEY,
  colegio_id UUID,
  title TEXT NOT NULL,
  project TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'finished', 'in_progress', 'overdue', 'backlog'
  priority TEXT DEFAULT 'Medium',            -- 'High', 'Medium', 'Low'
  progress INTEGER DEFAULT 0,
  due_date TEXT DEFAULT '',
  completed_at TEXT,
  assignees JSONB DEFAULT '[]'::jsonb,
  effort TEXT DEFAULT '1 Bloque libre (1.5 hrs)',
  scheduled_days JSONB DEFAULT '[]'::jsonb,
  scheduled_slot TEXT DEFAULT '10:00 - 11:30',
  dependency TEXT DEFAULT '',
  description TEXT DEFAULT '',
  checklist JSONB DEFAULT '[]'::jsonb,
  comments_count INTEGER DEFAULT 0,
  attachments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de Configuración Organizacional (Disponibilidad semanal y Categorías)
CREATE TABLE IF NOT EXISTS public.organizacional_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  colegio_id UUID,
  availability JSONB DEFAULT '{}'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.organizacional_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizacional_config ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso RLS (Lectura y Escritura para Usuarios Autenticados y Rol de Servicio)
DROP POLICY IF EXISTS "Permitir lectura organizacional_tareas" ON public.organizacional_tareas;
CREATE POLICY "Permitir lectura organizacional_tareas" ON public.organizacional_tareas 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion organizacional_tareas" ON public.organizacional_tareas;
CREATE POLICY "Permitir insercion organizacional_tareas" ON public.organizacional_tareas 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion organizacional_tareas" ON public.organizacional_tareas;
CREATE POLICY "Permitir actualizacion organizacional_tareas" ON public.organizacional_tareas 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion organizacional_tareas" ON public.organizacional_tareas;
CREATE POLICY "Permitir eliminacion organizacional_tareas" ON public.organizacional_tareas 
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir lectura organizacional_config" ON public.organizacional_config;
CREATE POLICY "Permitir lectura organizacional_config" ON public.organizacional_config 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura organizacional_config" ON public.organizacional_config;
CREATE POLICY "Permitir escritura organizacional_config" ON public.organizacional_config 
  FOR ALL USING (true);

-- 4. Semilla inicial de tareas del equipo (Solo si no existen)
INSERT INTO public.organizacional_tareas (
  id, title, project, status, priority, progress, due_date, completed_at, assignees, description, checklist
)
VALUES 
  ('task-1', 'Pruebas en horario kanban', 'DESARROLLO DE SOFTW...', 'finished', 'Low', 100, '21 oct 2026', '21 oct 2026', '["m-1", "m-2"]'::jsonb, 'pruebas de uso', '[]'::jsonb),
  ('task-2', 'Pruebas de Conexión BLE Giiker / Joicube', 'HARDWARE CTI', 'finished', 'High', 100, '08 Oct, 2026', '08 Oct, 2026', '["m-1", "m-3"]'::jsonb, 'Emparejamiento Web Bluetooth API con cifrado AES en tiempo real.', '[]'::jsonb),
  ('task-3', 'Auditoria Forense Inmutable SHA-256', 'SEGURIDAD', 'finished', 'Medium', 100, '05 Oct, 2026', '05 Oct, 2026', '["m-1", "m-2", "m-4"]'::jsonb, 'Trazabilidad criptográfica de cada edición clínica del expediente.', '[]'::jsonb),
  ('task-4', 'prueba 2 horario kanban', '', 'in_progress', 'High', 50, '25 oct 2026', null, '["m-2"]'::jsonb, '', '[{"id": 1, "text": "Prueba 1", "completed": false}, {"id": 2, "text": "Prueba 2", "completed": false}]'::jsonb),
  ('task-5', 'Diseño de Batería Nivel 5: Reaction Mirror', 'BATERÍA 5 NIVELES', 'in_progress', 'High', 16, '12 Oct, 2026', null, '["m-1", "m-2", "m-3"]'::jsonb, 'Calibración de LEDs inteligentes con respuesta motriz de 250ms.', '[]'::jsonb),
  ('task-6', 'Check-in Diario Integrado con Directorio', 'PLATAFORMA PIE', 'in_progress', 'Medium', 40, '14 Oct, 2026', null, '["m-1", "m-4"]'::jsonb, 'Notificaciones de casos de alta prioridad y derivaciones urgentes.', '[]'::jsonb),
  ('task-7', 'Análisis Estadístico Latencias de Giro', 'TELEMETRÍA 3D', 'overdue', 'High', 85, '15 Oct, 2026', null, '["m-1", "m-3"]'::jsonb, 'Correlación entre rotación espacial y niveles de impulsividad detectados.', '[]'::jsonb),
  ('task-8', 'Capacitación a Docentes de Aula Común', 'CAPACITACIÓN', 'backlog', 'Low', 20, '25 Oct, 2026', null, '["m-4"]'::jsonb, 'Taller de interpretación de informes de funciones ejecutivas.', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5. Semilla inicial de disponibilidad de horarios de los 4 integrantes
INSERT INTO public.organizacional_config (id, availability, categories)
VALUES (
  'default',
  '{
    "m-1": { "Lunes-10:00 - 11:30": true, "Miércoles-14:30 - 16:00": true, "Viernes-10:00 - 11:30": true },
    "m-2": { "Lunes-10:00 - 11:30": true, "Martes-11:30 - 13:00": true, "Jueves-16:00 - 17:30": true },
    "m-3": { "Miércoles-10:00 - 11:30": true, "Miércoles-14:30 - 16:00": true, "Viernes-14:30 - 16:00": true },
    "m-4": { "Martes-08:30 - 10:00": true, "Jueves-10:00 - 11:30": true, "Viernes-16:00 - 17:30": true }
  }'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
