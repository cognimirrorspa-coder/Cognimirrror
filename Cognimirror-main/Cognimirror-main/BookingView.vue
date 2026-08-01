<script setup>
import { ref, computed } from 'vue'

// Estado del Agendamiento
const currentStep = ref(1)
const isSubmitted = ref(false)

// Datos de Entrada
const evaluadores = [
  { id: 'matias', name: 'Matías Fierro', initial: 'MF', role: 'Investigador Principal', desc: 'Especialista en Telemetría Cognitiva' },
  { id: 'josue', name: 'Josué Alarcón', initial: 'JA', role: 'Coordinador Clínico', desc: 'Especialista en Análisis Motriz' },
  { id: 'brayan', name: 'Brayan Castro', initial: 'BC', role: 'Desarrollador de Hardware', desc: 'Especialista en Integración IoT' }
]

const horariosDisponibles = [
  { id: 1, day: 'Lunes', time: '10:00' },
  { id: 2, day: 'Lunes', time: '10:15' },
  { id: 3, day: 'Lunes', time: '10:30' },
  { id: 4, day: 'Lunes', time: '10:45' },
  { id: 5, day: 'Martes', time: '14:00' },
  { id: 6, day: 'Martes', time: '14:15' },
  { id: 7, day: 'Martes', time: '14:30' },
  { id: 8, day: 'Martes', time: '14:45' },
  { id: 9, day: 'Jueves', time: '16:00' },
  { id: 10, day: 'Jueves', time: '16:15' },
  { id: 11, day: 'Jueves', time: '16:30' },
  { id: 12, day: 'Jueves', time: '16:45' }
]

// Selecciones del Usuario
const selectedEvaluador = ref(null)
const selectedHorario = ref(null)

// Formulario Clínico (Paso 3)
const nombreCompleto = ref('')
const correoElectronico = ref('')
const institucion = ref('')
const tieneDificultadVisual = ref(null) // 'si' | 'no'
const horasSueno = ref(null)
const haConsumidoEstimulantes = ref(null) // 'si' | 'no'

// Consentimiento (Paso 4)
const aceptarConsentimiento = ref(false)

// Validación del Formulario
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(correoElectronico.value)
})

const isFormComplete = computed(() => {
  return nombreCompleto.value.trim().length >= 3 &&
         isEmailValid.value &&
         institucion.value !== '' &&
         tieneDificultadVisual.value !== null &&
         horasSueno.value !== null && horasSueno.value >= 0 && horasSueno.value <= 24 &&
         haConsumidoEstimulantes.value !== null
})

const isStep1Valid = computed(() => selectedEvaluador.value !== null)
const isStep2Valid = computed(() => selectedHorario.value !== null)
const isStep3Valid = computed(() => isFormComplete.value)
const isStep4Valid = computed(() => aceptarConsentimiento.value)

// Validación general para el botón de confirmación
const canConfirm = computed(() => {
  return isStep1Valid.value && isStep2Valid.value && isStep3Valid.value && isStep4Valid.value
})

// Control de Navegación del Stepper
const setStep = (step) => {
  if (step === 2 && !isStep1Valid.value) return
  if (step === 3 && (!isStep1Valid.value || !isStep2Valid.value)) return
  if (step === 4 && (!isStep1Valid.value || !isStep2Valid.value || !isStep3Valid.value)) return
  currentStep.value = step
}

const nextStep = () => {
  if (currentStep.value === 1 && isStep1Valid.value) {
    currentStep.value = 2
  } else if (currentStep.value === 2 && isStep2Valid.value) {
    currentStep.value = 3
  } else if (currentStep.value === 3 && isStep3Valid.value) {
    currentStep.value = 4
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleConfirm = () => {
  if (canConfirm.value) {
    isSubmitted.value = true
  }
}

const resetBooking = () => {
  currentStep.value = 1
  isSubmitted.value = false
  selectedEvaluador.value = null
  selectedHorario.value = null
  nombreCompleto.value = ''
  correoElectronico.value = ''
  institucion.value = ''
  tieneDificultadVisual.value = null
  horasSueno.value = null
  haConsumidoEstimulantes.value = null
  aceptarConsentimiento.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
    <div class="w-full max-w-2xl bg-[#111827]/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
      
      {/* Glows de Fondo (Estilo DeepTech) */}
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Pantalla de Éxito al Confirmar */}
      <div v-if="isSubmitted" class="text-center py-10 space-y-6 animate-fade-in relative z-10">
        <div class="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="space-y-2">
          <h2 class="text-2xl font-black tracking-tight text-white">¡Reserva de Hora Exitosa!</h2>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Hemos registrado tu bloque en el Estudio Clínico CogniMirror 2026. Te enviamos una confirmación por correo.
          </p>
        </div>
        
        {/* Resumen Final */}
        <div class="bg-slate-950/40 rounded-2xl border border-slate-800 p-4 max-w-sm mx-auto space-y-2.5 text-left text-xs">
          <div class="flex justify-between border-b border-white/5 pb-2">
            <span class="text-slate-500">Evaluador:</span>
            <span class="font-bold text-white">{{ evaluadores.find(e => e.id === selectedEvaluador)?.name }}</span>
          </div>
          <div class="flex justify-between border-b border-white/5 pb-2">
            <span class="text-slate-500">Horario:</span>
            <span class="font-bold text-blue-400">
              {{ horariosDisponibles.find(h => h.id === selectedHorario)?.day }} 
              {{ horariosDisponibles.find(h => h.id === selectedHorario)?.time }} (15 min)
            </span>
          </div>
          <div class="flex justify-between border-b border-white/5 pb-2">
            <span class="text-slate-500">Participante:</span>
            <span class="font-bold text-white">{{ nombreCompleto }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Institución:</span>
            <span class="font-bold text-white">{{ institucion }}</span>
          </div>
        </div>

        <button 
          @click="resetBooking"
          class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/25"
        >
          Agendar Otra Hora
        </button>
      </div>

      {/* Flujo de Agendamiento */}
      <div v-else class="relative z-10 space-y-8">
        
        {/* Encabezado Principal */}
        <div class="text-center space-y-1">
          <h1 class="text-2xl font-black text-white flex items-center justify-center gap-2">
            <span class="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs">CM</span>
            Estudio Clínico CogniMirror
          </h1>
          <p class="text-xs text-slate-400">Reserva tu bloque y mide tus reflejos cognitivos de forma gratuita.</p>
        </div>

        {/* Stepper Superior */}
        <div class="flex items-center justify-between max-w-md mx-auto relative px-4">
          <div class="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />
          
          <button 
            v-for="stepNum in 4" 
            :key="stepNum"
            @click="setStep(stepNum)"
            :disabled="stepNum > 1 && (stepNum === 2 && !isStep1Valid || stepNum === 3 && (!isStep1Valid || !isStep2Valid) || stepNum === 4 && (!isStep1Valid || !isStep2Valid || !isStep3Valid))"
            class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 relative z-10 disabled:cursor-not-allowed focus:outline-none"
            :class="[
              currentStep === stepNum 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25 scale-110' 
                : currentStep > stepNum 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-[#111827] border-slate-800 text-slate-500'
            ]"
          >
            {{ stepNum }}
          </button>
        </div>

        {/* CONTENIDO DE CADA PASO */}
        <div class="min-h-[220px] transition-all duration-300">
          
          {/* PASO 1: SELECCIÓN DE EVALUADOR */}
          <div v-if="currentStep === 1" class="space-y-4 animate-fade-in">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Paso 1: Selecciona a tu Evaluador</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div 
                v-for="ev in evaluadores" 
                :key="ev.id"
                @click="selectedEvaluador = ev.id"
                class="bg-[#0e1320]/60 border rounded-2xl p-4 cursor-pointer text-left flex flex-col justify-between h-40 transition-all duration-300 transform hover:translate-y-[-2px] relative overflow-hidden group"
                :class="[
                  selectedEvaluador === ev.id 
                    ? 'border-blue-500 bg-blue-500/[0.03] shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'border-slate-800/80 hover:border-slate-700/80'
                ]"
              >
                <div class="flex justify-between items-start">
                  <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                    {{ ev.initial }}
                  </div>
                  <div 
                    v-if="selectedEvaluador === ev.id"
                    class="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white"
                  >
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 class="font-bold text-white text-sm leading-tight">{{ ev.name }}</h4>
                  <p class="text-[9px] text-blue-400 mt-0.5">{{ ev.role }}</p>
                  <p class="text-[9px] text-slate-500 mt-1 line-clamp-1 group-hover:text-slate-400 transition-colors">{{ ev.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          {/* PASO 2: SELECCIÓN DE HORARIOS (15 MIN BLOCKS) */}
          <div v-if="currentStep === 2" class="space-y-4 animate-fade-in">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Paso 2: Selecciona un Horario</h3>
            
            <div class="bg-slate-950/20 border border-slate-800/60 rounded-2xl p-4 max-h-[220px] overflow-y-auto custom-scrollbar">
              <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <button
                  v-for="horario in horariosDisponibles"
                  :key="horario.id"
                  @click="selectedHorario = horario.id"
                  class="py-2.5 px-2 text-xs font-bold rounded-xl border text-center transition-all duration-300"
                  :class="[
                    selectedHorario === horario.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-[#0e1320]/40 border-slate-800/80 text-slate-300 hover:border-slate-700/80 hover:bg-[#0e1320]/80'
                  ]"
                >
                  {{ horario.time }}
                  <span class="block text-[8px] text-slate-500 mt-0.5">{{ horario.day }}</span>
                </button>
              </div>
            </div>
          </div>

          {/* PASO 3: FORMULARIO CLÍNICO */}
          <div v-if="currentStep === 3" class="space-y-5 animate-fade-in text-left">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Paso 3: Filtro Clínico & Registro</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                <input 
                  type="text" 
                  v-model="nombreCompleto"
                  placeholder="Ej: Carolina González"
                  class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              {/* Correo Electrónico */}
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
                <input 
                  type="email" 
                  v-model="correoElectronico"
                  placeholder="ejemplo@correo.cl"
                  class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  :class="[correoElectronico.length > 0 && !isEmailValid ? 'border-red-500/50' : 'border-slate-800 focus:border-blue-500']"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Institución */}
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Institución de Estudio</label>
                <select
                  v-model="institucion"
                  class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>Selecciona tu institución</option>
                  <option value="Duoc UC Puerto Montt">Duoc UC Puerto Montt</option>
                  <option value="Santo Tomás Puerto Montt">Santo Tomás Puerto Montt</option>
                </select>
              </div>

              {/* Filtro Visual */}
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">¿Dificultad visual / daltonismo no corregido?</label>
                <div class="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    @click="tieneDificultadVisual = true"
                    class="py-2.5 rounded-xl border text-xs font-bold transition-all"
                    :class="[tieneDificultadVisual === true ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-[#0b0e17] border-slate-800 text-slate-400']"
                  >
                    Sí, tengo
                  </button>
                  <button
                    type="button"
                    @click="tieneDificultadVisual = false"
                    class="py-2.5 rounded-xl border text-xs font-bold transition-all"
                    :class="[tieneDificultadVisual === false ? 'bg-[#0b0e17] border-slate-700 text-white' : 'bg-[#0b0e17] border-slate-800 text-slate-400']"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-3">
              {/* Horas Sueño */}
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">¿Cuántas horas dormiste anoche?</label>
                <input 
                  type="number" 
                  v-model="horasSueno"
                  min="0"
                  max="24"
                  placeholder="Ej: 7"
                  class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              {/* Cafeína / Estimulantes */}
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">¿Consumo de cafeína / energéticas (últimas 3 hrs)?</label>
                <div class="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    @click="haConsumidoEstimulantes = true"
                    class="py-2.5 rounded-xl border text-xs font-bold transition-all"
                    :class="[haConsumidoEstimulantes === true ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-[#0b0e17] border-slate-800 text-slate-400']"
                  >
                    Sí, he consumido
                  </button>
                  <button
                    type="button"
                    @click="haConsumidoEstimulantes = false"
                    class="py-2.5 rounded-xl border text-xs font-bold transition-all"
                    :class="[haConsumidoEstimulantes === false ? 'bg-[#0b0e17] border-slate-700 text-white' : 'bg-[#0b0e17] border-slate-800 text-slate-400']"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PASO 4: CONSENTIMIENTO Y CONFIRMACIÓN */}
          <div v-if="currentStep === 4" class="space-y-5 animate-fade-in text-left">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Paso 4: Consentimiento del Participante</h3>
            
            {/* Ficha Resumen */}
            <div class="bg-slate-950/40 rounded-2xl border border-slate-800 p-4 space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-500">Evaluador:</span>
                <span class="font-bold text-white">{{ evaluadores.find(e => e.id === selectedEvaluador)?.name }}</span>
              </div>
              <div className="flex justify-between">
                <span class="text-slate-500">Horario reservado:</span>
                <span class="font-bold text-blue-400">
                  {{ horariosDisponibles.find(h => h.id === selectedHorario)?.day }} a las
                  {{ horariosDisponibles.find(h => h.id === selectedHorario)?.time }}
                </span>
              </div>
              <div className="flex justify-between">
                <span class="text-slate-500">Participante:</span>
                <span class="font-bold text-white">{{ nombreCompleto }}</span>
              </div>
            </div>

            {/* Caja de Consentimiento */}
            <div class="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-[10px] text-slate-400 leading-relaxed max-h-[100px] overflow-y-auto custom-scrollbar">
              <p class="font-bold text-slate-300 mb-1">ASENTIMIENTO INFORMADO · ESTUDIO COGNIMIRROR 2026</p>
              Declaro que mi participación en este estudio es completamente voluntaria. Entiendo que se me realizará una evaluación cognitiva de 20 minutos utilizando hardware interactivo (cubo rubik inteligente) y que los datos recopilados serán anonimizados y procesados de manera confidencial para fines de validación científica y académica de la startup universitaria.
            </div>

            {/* Checkbox Obligatorio */}
            <label class="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                v-model="aceptarConsentimiento"
                class="mt-0.5 rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-blue-500 focus:ring-offset-[#0B0F19] w-4 h-4 cursor-pointer"
              />
              <span class="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors leading-tight select-none">
                He leído y acepto el Asentimiento Informado del estudio CogniMirror. Entiendo que los datos de telemetría serán anónimos y utilizados para validación científica.
              </span>
            </label>
          </div>

        </div>

        {/* NAVEGACIÓN INFERIOR (BACK / NEXT / CONFIRM) */}
        <div class="flex justify-between items-center border-t border-white/5 pt-4 mt-6">
          <button 
            @click="prevStep" 
            v-if="currentStep > 1"
            class="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/10 text-white transition-colors"
          >
            Atrás
          </button>
          <div v-else />

          <button 
            v-if="currentStep < 4"
            @click="nextStep"
            :disabled="(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid) || (currentStep === 3 && !isStep3Valid)"
            class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10"
          >
            Continuar
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            v-else
            @click="handleConfirm"
            :disabled="!canConfirm"
            class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-blue-500/25"
          >
            Confirmar mi Reserva
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<style>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scrollbar Personalizada */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
