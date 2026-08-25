-- ==============================================================================
-- ACTUALIZACIÓN: ROLES DINÁMICOS Y MULTIDISCIPLINARIOS PIE
-- ==============================================================================

-- 1. Eliminar cualquier restricción de check rígida en perfiles.rol
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- 2. Asegurar que perfiles.rol soporte cadenas de texto descriptivas libres
ALTER TABLE public.perfiles ALTER COLUMN rol TYPE VARCHAR(100);

-- 3. Notificación de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Restricciones de rol eliminadas con éxito. Ahora se admiten roles multidisciplinarios libres (Fonoaudiólogo, Educador Diferencial, etc.)';
END $$;
