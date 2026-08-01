'use client';

import React from 'react';
import { 
  Plus, Brain, Zap, Shield, HelpCircle, FileText, Cpu, Code, 
  Settings, CheckCircle, Smartphone, Database, AlertCircle, Play, Lock 
} from 'lucide-react';
import Link from 'next/link';

export const SLIDES_COUNT = 15;

export function getSlideComponent(index) {
  const slides = [
    // SLIDE 1: Portada formal
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 relative">
      <span className="text-sm font-black tracking-[0.4em] text-purple-500 uppercase mb-4">Examen de Título</span>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-purple-500 mb-6 drop-shadow-2xl">
        COGNIMIRROR
      </h1>
      <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-pink-600 mb-8 rounded-full" />
      <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-light leading-relaxed mb-12">
        Sistema de Evaluación Cognitiva Neuropsicológica a través de Hardware Hápico Inteligente Conectado.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-xl w-full bg-white/[0.01] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Expositor</span>
          <p className="text-white font-bold text-lg mt-0.5">Brayan Castro Castro</p>
          <p className="text-slate-400 text-xs mt-0.5">Portafolio de Título - Sección TPY1101-001D</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Institución</span>
          <p className="text-white font-bold text-lg mt-0.5">Duoc UC</p>
          <p className="text-slate-400 text-xs mt-0.5">Sede Puerto Montt</p>
        </div>
      </div>
    </div>,

    // SLIDE 2: Introducción
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">01 / Introducción y Contexto</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Salud Mental e Innovación Tecnológica
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-purple-500/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
            <Brain size={20} />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">Evaluación Clínica</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            La neuropsicología tradicional se basa fuertemente en pruebas estáticas de papel y lápiz, propensas al sesgo subjetivo y fatiga.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-pink-500/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4">
            <Cpu size={20} />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">Hardware Inteligente</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            La irrupción de sensores magnéticos embebidos en dispositivos cotidianos abre la puerta al registro clínico de telemetrías motrices finas.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-cyan-500/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
            <Shield size={20} />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">HealthTech Infantil</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            La gamificación de test de atención e inhibición mediante cubos inteligentes incrementa significativamente el *engagement* infantil.
          </p>
        </div>
      </div>
    </div>,

    // SLIDE 3: Definición del Problema
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">02 / Planteamiento del Problema</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Limitaciones Diagnósticas Actuales
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.01] border border-white/5 p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> El Desafío de la Subjetividad
            </h3>
            <ul className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="text-red-500">✗</span> Dificultad para registrar tiempos de reacción en milisegundos de forma manual.
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">✗</span> Falta de herramientas inmersivas en escuelas públicas chilenas (Programa PIE).
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">✗</span> Pérdida de continuidad clínica entre sesiones por reportes no estructurados.
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white/[0.01] border border-white/5 p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <CheckCircle size={18} /> La Propuesta CogniMirror
            </h3>
            <ul className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="text-green-500">✓</span> Captura objetiva del tiempo de reacción con corrección por latencia BLE.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span> Gamificación no invasiva con cubo Rubik conectado vía Web Bluetooth.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span> Almacenamiento centralizado e informes automatizados Decreto 170.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>,

    // SLIDE 4: Objetivos
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">03 / Formulación de Objetivos</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Propósitos del Proyecto
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-purple-500/10 to-pink-500/5 border border-purple-500/20 p-6 rounded-2xl">
          <h3 className="text-xs font-black tracking-widest text-purple-300 uppercase mb-2">Objetivo General</h3>
          <p className="text-white text-lg font-bold">
            Diseñar e implementar una plataforma web integrada a un cubo Rubik hápico inteligente para evaluar y monitorear el desempeño de funciones cognitivas de atención y memoria visoespacial en escolares.
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Específico 1</span>
          <h4 className="font-bold text-white mt-1 mb-2">Conectividad BLE</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Implementar la comunicación bidireccional mediante protocolo Bluetooth GATT en navegadores Chrome y Edge sin plugins externos.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Específico 2</span>
          <h4 className="font-bold text-white mt-1 mb-2">Evaluación Clínica</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Codificar la lógica digital de los test Reaction Mirror (Go/No-Go) y Memory Mirror (Corsi), registrando y clasificando errores.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Específico 3</span>
          <h4 className="font-bold text-white mt-1 mb-2">Gestión y Reportes</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Desarrollar un portal clínico multi-tenant para psicólogos con gráficos longitudinales y reportes PDF Decreto 170.
          </p>
        </div>
      </div>
    </div>,

    // SLIDE 5: Marco Teórico Clínico
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">04 / Marco Teórico Clínico</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Paradigmas de Evaluación Cognitiva
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">Reaction Mirror</h3>
          </div>
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 text-indigo-400">Paradigma Go / No-Go</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Mide control inhibitorio y velocidad de procesamiento motor. El sujeto debe accionar ante el estímulo target (Go - Rojo/Naranja) e inhibir la acción ante estímulos distractores (No-Go - Azul/Verde). Mide aciertos, omisiones y fallos de inhibición.
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Brain size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">Memory Mirror</h3>
          </div>
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 text-purple-400">Test de Bloques de Corsi</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Evalúa la memoria de trabajo visoespacial a corto plazo. El software enciende bloques en pantalla que el usuario debe reproducir en orden girando el cubo. Permite medir el Corsi Span y clasificar fallos atencionales (Primacy/Recency).
          </p>
        </div>
      </div>
    </div>,

    // SLIDE 6: Marco Teórico Tecnológico
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">05 / Tecnologías del Proyecto</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Stack Tecnológico Elegido
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <Code className="mx-auto text-purple-400 mb-4" size={28} />
          <h3 className="font-bold text-white text-sm">Next.js 14</h3>
          <p className="text-slate-500 text-[10px] mt-1">App Router / React SPA</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <Database className="mx-auto text-indigo-400 mb-4" size={28} />
          <h3 className="font-bold text-white text-sm">Supabase</h3>
          <p className="text-slate-500 text-[10px] mt-1">Postgres / Auth / RLS</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <Smartphone className="mx-auto text-pink-400 mb-4" size={28} />
          <h3 className="font-bold text-white text-sm">Web BLE API</h3>
          <p className="text-slate-500 text-[10px] mt-1">Protocolo GATT nativo</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <Cpu className="mx-auto text-cyan-400 mb-4" size={28} />
          <h3 className="font-bold text-white text-sm">Three.js</h3>
          <p className="text-slate-500 text-[10px] mt-1">Renderizado 3D WebGL</p>
        </div>
      </div>
    </div>,

    // SLIDE 7: Arquitectura de la Solución (4+1 Vistas)
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">06 / Diseño y Arquitectura</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Arquitectura del Sistema (4+1 Vistas)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-indigo-400 text-sm uppercase tracking-wider mb-2">Vista Lógica</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Separación estricta de responsabilidades: Contextos React para BLE, Autenticación y Estado del Cubo. Custom hooks encapsulan operaciones a Supabase DB.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-purple-400 text-sm uppercase tracking-wider mb-2">Vista de Procesos</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Captura ininterrumpida de eventos de giro mediante notificaciones asíncronas GATT de Bluetooth, decodificando tramas binarias en hilos del cliente en &lt;5ms.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-pink-400 text-sm uppercase tracking-wider mb-2">Vista de Despliegue</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Frontend alojado de manera global en Vercel Edge Network. Backend y Base de Datos Postgres multi-tenant centralizados en Supabase Cloud.
          </p>
        </div>
      </div>
    </div>,

    // SLIDE 8: Requerimientos Funcionales
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">07 / Ingeniería de Software</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-6 tracking-tight">
        Requerimientos Funcionales Críticos
      </h2>
      
      <div className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-300 font-bold uppercase tracking-wider border-b border-white/5">
              <th className="p-4 w-24">ID</th>
              <th className="p-4 w-40">Módulo</th>
              <th className="p-4">Requerimiento Funcional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            <tr>
              <td className="p-4 font-mono font-bold text-purple-400">RF-SEC-01</td>
              <td className="p-4 font-bold">Autenticación</td>
              <td className="p-4">El sistema debe validar credenciales de especialistas y permitir un bypass offline local en situaciones de emergencia.</td>
            </tr>
            <tr>
              <td className="p-4 font-mono font-bold text-purple-400">RF-HW-01</td>
              <td className="p-4 font-bold">Conectividad Háptica</td>
              <td className="p-4">Establecer emparejamiento con el cubo inteligente por BLE y decodificar cada giro físico en la UI de inmediato.</td>
            </tr>
            <tr>
              <td className="p-4 font-mono font-bold text-purple-400">RF-CLIN-02</td>
              <td className="p-4 font-bold">Métricas de Juego</td>
              <td className="p-4">Cálculo en tiempo real de la racha de aciertos, Corsi Span, tiempos de reacción y clasificaciones de errores.</td>
            </tr>
            <tr>
              <td className="p-4 font-mono font-bold text-purple-400">RF-REP-01</td>
              <td className="p-4 font-bold">Exportación</td>
              <td className="p-4">Generar informes diagnósticos individuales en PDF y consolidados en planillas de Excel para soporte del Decreto 170.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>,

    // SLIDE 9: Requerimientos No Funcionales y Seguridad
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">08 / Seguridad y Atributos de Calidad</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Requerimientos No Funcionales (RNF)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 mb-3">
            <Shield size={16} />
          </div>
          <h3 className="font-bold text-white text-sm mb-2">Aislamiento Criptográfico</h3>
          <p className="text-slate-400 text-xs leading-relaxed font-mono">
            Row Level Security (RLS) activo en Supabase. Consultas autenticadas por JWT impiden fugas de datos entre psicólogos (Ley 19.628).
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
            <Smartphone size={16} />
          </div>
          <h3 className="font-bold text-white text-sm mb-2">Compatibilidad</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Soporte nativo en navegadores basados en Chromium (Chrome/Edge) para habilitar Web Bluetooth API sin necesidad de instalar apps.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 mb-3">
            <Database size={16} />
          </div>
          <h3 className="font-bold text-white text-sm mb-2">Resiliencia y Cache</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Almacenamiento diferido local asíncrono para persistir la telemetría en offline y sincronizar al recuperar internet.
          </p>
        </div>
      </div>
    </div>,

    // SLIDE 10: Integración Háptica
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">09 / Integración del Hardware</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Conectividad Háptica (Web Bluetooth)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl font-mono text-xs text-slate-300 leading-relaxed">
          <h3 className="text-purple-400 font-bold text-sm mb-4 flex items-center gap-1.5"><Code size={16} /> Protocolo de Tramas GATT</h3>
          <p className="mb-2">// Notificación BLE que envía el cubo al girar:</p>
          <p className="bg-black/40 p-2 border border-white/5 rounded text-yellow-400 mb-4">
            CharacteristicValue: [0x12, 0x01, 0x52, 0x00, 0x08, ...]
          </p>
          <p>Donde el byte 2 identifica la cara y el sentido del giro:</p>
          <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-400 text-[11px]">
            <li>`0x52` (ASCII \'R\') = Giro Cara Derecha</li>
            <li>`0x4C` (ASCII \'L\') = Giro Cara Izquierda</li>
            <li>`0x55` (ASCII \'U\') = Giro Cara Superior</li>
          </ul>
        </div>

        <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <Settings size={20} className="text-purple-500" /> Control de Ruido Mecánico
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Al operar el cubo de forma manual, se pueden producir micro-rotaciones o rebotes en las caras.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Implementamos un **filtro lógico de cooldown de 1200ms** por software. Esto ignora cualquier trama consecutiva idéntica dentro del umbral, bloqueando giros involuntarios.
            </p>
          </div>
        </div>
      </div>
    </div>,

    // SLIDE 11: Algoritmos Clínicos
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">10 / Lógica de Negocio y Neuropsicología</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Algoritmos y Lógica de Métricas
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-lg mb-2">Corsi Span</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Calcula el máximo nivel (longitud de secuencia) en el que el paciente completó exitosamente al menos un intento sin equivocarse.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-lg mb-2">Vulnerabilidad de Secuencia</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Analiza la posición del error en la racha: **Primacy** si ocurrió al inicio (falla atencional) o **Recency** si ocurrió al final (saturación de memoria de trabajo).
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-lg mb-2">Supra-Span Resistance</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Mide cuantitativamente la resiliencia del sujeto frente a la sobrecarga de datos cuando la longitud excede su Span límite.
          </p>
        </div>
      </div>
    </div>,

    // SLIDE 12: Estrategia de Testing
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">11 / Aseguramiento de Calidad (QA)</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Estrategia de QA y Batería de Pruebas
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <FileText size={20} className="text-purple-400" /> Matriz de Casos de Prueba
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Se definieron **36 casos de prueba (CP)** detallados, subdivididos en 8 módulos operacionales del sistema:
          </p>
          <ul className="grid grid-cols-2 gap-2 text-slate-300 text-xs">
            <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-purple-500" /> Autenticación y RLS</li>
            <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-purple-500" /> Hardware BLE</li>
            <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-purple-500" /> Métricas de Juegos</li>
            <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-purple-500" /> Directorio Pacientes</li>
            <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-purple-500" /> Sincronización Offline</li>
            <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-purple-500" /> Reportes Decreto 170</li>
          </ul>
        </div>

        <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" /> Criterios de Aceptación
            </h3>
            <ul className="space-y-3 text-slate-400 text-xs">
              <li className="flex gap-2">
                <span className="text-green-500">✓</span> Latencia de procesamiento BLE en el cliente &lt; 50ms.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span> Aislamiento criptográfico multi-tenant 100% verificado en base de datos.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span> Persistencia e integridad del reporte individual y folios Decreto 170.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>,

    // SLIDE 13: Mitigación de Errores Reales
    <div className="max-w-4xl mx-auto px-4">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">12 / Control de Errores y Estabilización</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-8 tracking-tight">
        Acciones Correctivas Basadas en Pruebas
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-base mb-2 flex items-center gap-1.5">
            <Lock size={16} className="text-red-400" /> Fuga en Modo Kiosco (CP-SEC-05)
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-2 font-mono">
            [Falla]: El alumno podía salirse del juego y entrar al dashboard recargando (F5) o apretando volver en calibración.
          </p>
          <p className="text-slate-300 text-xs leading-relaxed">
            [Solución]: Inyección de un interceptor en `AuthGuard.jsx` que detecta la recarga de página y despliega bloqueo a pantalla completa exigiendo PIN `1234`.
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-base mb-2 flex items-center gap-1.5">
            <Database size={16} className="text-orange-400" /> Sincronización Diferida (CP-SYNC-02)
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-2 font-mono">
            [Falla]: Datos locales guardados offline se sobreescribían al reconectar internet y refrescar.
          </p>
          <p className="text-slate-300 text-xs leading-relaxed">
            [Solución]: Se unificó localStorage a `cognimirror_offline_patients` y se implementó un despachador que sincroniza lotes a Supabase de forma secuencial al detectar red.
          </p>
        </div>
      </div>
    </div>,

    // SLIDE 14: Demostración Interactiva
    <div className="max-w-4xl mx-auto px-4 text-center">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">13 / Demostración en Vivo</span>
      <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-12 tracking-tight">
        Módulos Clínicos en Tiempo Real
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Link 
          href="/reaction-game?modo=defensa" 
          className="group relative bg-[#07080f] border border-white/10 hover:border-indigo-500/50 p-8 rounded-3xl cursor-pointer hover:bg-white/[0.02] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center shadow-2xl"
        >
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <Zap size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Reaction Mirror</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            Ensayo rápido comprimido a 5 rondas para demostrar el paradigma de inhibición Go/No-Go.
          </p>
          <div className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase text-indigo-400 group-hover:text-indigo-300">
            <Play size={10} /> Iniciar Demo (15s)
          </div>
        </Link>

        <Link 
          href="/simon-game?modo=defensa" 
          className="group relative bg-[#07080f] border border-white/10 hover:border-purple-500/50 p-8 rounded-3xl cursor-pointer hover:bg-white/[0.02] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center shadow-2xl"
        >
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Brain size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Memory Mirror</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            Test de bloques de Corsi rápido que finaliza con éxito al completar el Nivel 3.
          </p>
          <div className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase text-purple-400 group-hover:text-purple-300">
            <Play size={10} /> Iniciar Demo (15s)
          </div>
        </Link>
      </div>
    </div>,

    // SLIDE 15: Conclusión y Cierre
    <div className="max-w-4xl mx-auto px-4 text-center">
      <span className="text-xs font-black tracking-widest text-purple-400 uppercase">14 / Cierre y Conclusiones</span>
      <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-purple-400 mt-2 mb-8 tracking-tight">
        Conclusión y Proyecciones
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-12">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-base mb-2">Aporte del Software</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Se logró con éxito el desarrollo de una herramienta objetiva y asequible basada en hardware comercial, transformando el testeo cognitivo clínico tradicional en una experiencia gamificada e interactiva de alta precisión.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-white text-base mb-2">Escalabilidad Futura</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            El sistema permite la incorporación de nuevos test cognitivos (ej: pruebas de motricidad fina mediante rotación de capas del cubo) y analítica predictiva de fatiga acumulada a gran escala.
          </p>
        </div>
      </div>
      
      <h3 className="text-2xl font-black text-white tracking-tight">Muchas Gracias.</h3>
      <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">¿Preguntas de la Comisión Evaluadora?</p>
    </div>
  ];

  if (index >= 0 && index < slides.length) {
    return slides[index];
  }
  return null;
}
