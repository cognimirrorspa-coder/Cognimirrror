'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePatientsDB } from '../../../hooks/usePatientsDB';
import FichaEstudiantePIE from '../../../components/FichaEstudiantePIE';
import { supabase } from '../../../utils/supabaseClient';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id;
  const { getPatient, loadingPatients } = usePatientsDB();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirigir inmediatamente al Dashboard para mantener el menú y la navegación completa
  useEffect(() => {
    if (studentId) {
      router.replace(`/dashboard?tab=alumnos&student=${studentId}`);
    }
  }, [studentId, router]);

  // Fallback por si la redirección tarda unos milisegundos: Cargar el estudiante directamente
  useEffect(() => {
    if (!studentId) return;

    const cached = getPatient(studentId);
    if (cached) {
      setStudent(cached);
      setLoading(false);
      return;
    }

    if (!loadingPatients) {
      const queryId = decodeURIComponent(String(studentId)).trim();
      supabase
        .from('pacientes')
        .select('*, cursos(*)')
        .or(`id.eq.${queryId},id_sujeto.eq.${queryId}`)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const diag = data.diagnostico_nee || data.diagnostico_principal || 'Evaluación General';
            const isNeep = /permanente|neep|tea|autis|intelectual|motora|visual|auditiva|múltiple|multiple/i.test(diag);
            const cObj = data.cursos || null;
            const resolvedCurso = cObj?.nombre_completo || 
              (cObj?.nivel && cObj?.letra ? `${cObj.nivel} ${cObj.letra}` : null) || 
              (data.curso_id ? 'Curso Asignado' : '1° Básico A');

            setStudent({
              id: data.id,
              name: `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Estudiante',
              nombre: data.nombre || '',
              apellido: data.apellido || '',
              idSujeto: data.id_sujeto,
              createdAt: data.creado_en,
              colegioId: data.colegio_id,
              fechaNacimiento: data.fecha_nacimiento,
              diagnosticoNee: diag,
              tipoNee: isNeep ? 'NEEP' : 'NEET',
              cursoId: data.curso_id,
              curso: resolvedCurso,
              cursoNombre: resolvedCurso,
              sessions: []
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [studentId, getPatient, loadingPatients]);

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center p-4">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-mono animate-pulse">Abriendo ficha en el panel principal...</p>
        </div>
      ) : student ? (
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6">
          <FichaEstudiantePIE
            student={student}
            onBack={() => router.push('/dashboard?tab=alumnos')}
            isDark={true}
          />
        </div>
      ) : (
        <div className="text-center">
          <p className="text-slate-400 text-sm">Redirigiendo al panel de alumnos...</p>
        </div>
      )}
    </div>
  );
}
