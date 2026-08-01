# CogniMirror: Plataforma Digital para la Evaluación Neuropsicológica Longitudinal y Monitoreo en Tiempo Real

## Descripción del Proyecto
CogniMirror es un sistema clínico-tecnológico diseñado para la evaluación y estimulación de procesos cognitivos, atencionales y visoespaciales. Mediante la integración de un dispositivo físico inteligente (un cubo interactivo con sensores inerciales y conectividad Bluetooth Low Energy) y una aplicación web responsiva, la plataforma permite registrar telemetría fina y tiempos de reacción en milisegundos. El sistema está orientado a profesionales del área de la salud y educación, facilitando el diagnóstico y seguimiento longitudinal de pacientes y alumnos.

## Propósito y Objetivos
El objetivo principal de CogniMirror es optimizar la recopilación de datos clínicos cuantitativos durante pruebas neuropsicológicas y visoespaciales. Al digitalizar y automatizar la recolección de métricas clave (tiempos de reacción, tasas de error, inercia motora, fatiga cognitiva y memoria de secuencias), se proporciona una herramienta objetiva que complementa la evaluación cualitativa tradicional.

Objetivos específicos:
1. Facilitar la aplicación estructurada de pruebas clínicas (como el Test de Corsi y variantes del Test de Rendimiento Continuo).
2. Sincronizar en tiempo real el comportamiento físico del dispositivo interactivo con un gemelo digital 3D para telemonitoreo.
3. Proveer informes automatizados compatibles con normativas chilenas de educación especial (Decreto 170 / Programa de Integración Escolar - PIE).
4. Garantizar el resguardo y la continuidad operacional de la información clínica mediante un sistema descentralizado de copias de seguridad en la nube.

## Sector de Aplicación
El proyecto se enmarca en los sectores de:
* **Salud Digital y Neuropsicología:** Herramienta clínica de diagnóstico para neurólogos, neuropsicólogos, terapeutas ocupacionales y psicólogos clínicos.
* **Educación Especial (Programa de Integración Escolar - PIE):** Apoyo a psicopedagogos y educadores diferenciales para la justificación de subvenciones y diseño de planes de apoyo personalizado según el Decreto 170.

## Módulos y Características Clave

### 1. Directorio Longitudinal de Pacientes
Panel de administración centralizado que permite registrar sujetos, visualizar su historial acumulado de evaluaciones y analizar su progreso longitudinal mediante gráficos dinámicos de evolución.

### 2. Módulo Reaction Mirror (Tiempos de Reacción e Inhibición)
* Prueba atencional basada en estímulos auditivos y visuales de tipo GO (acción) y NOGO (inhibición).
* Permite diferenciar entre una evaluación clínica oficial (con mazo de estímulos optimizado científicamente de 40 ítems) y un modo de calentamiento o práctica ágil (de 15 segundos sin persistencia de datos).
* Ajuste dinámico de mazo: asegura inercia motora en los primeros turnos y un backtracking para evitar la predicción de estímulos.

### 3. Módulo Memory Mirror (Memoria Visoespacial)
* Prueba de memoria de trabajo visoespacial basada en la replicación de secuencias espaciales (análogo digital del Corsi Block-Tapping Test).
* Cuenta con soporte y refuerzo cognitivo mejorado (movimientos simulados en el cubo 3D, retroalimentación de pantalla con sacudidas visuales ante errores y texto gigante).

### 4. Telemonitoreo en Tiempo Real y Control Clínico Remoto
* Generación de enlaces temporales seguros (Magic Links) para que el paciente realice las pruebas a distancia.
* Sala de control clínico bidireccional donde el especialista puede monitorear en tiempo real la telemetría fina del paciente, ver el estado de su conexión y observar la orientación espacial del cubo a través de un gemelo digital en 3D basado en Three.js.
* Envío de comandos clínicos remotos para iniciar, pausar, cancelar o cambiar el tipo de evaluación en vivo.

### 5. Generación de Reportes y Exportación de Datos
* Exportación de datos masivos crudos en planillas Excel estructuradas (.xlsx) con desglose milimétrico de telemetría.
* Generación de informes en formato PDF con el rendimiento del paciente y justificación de fondos para el director del establecimiento (conforme a las directrices del Decreto 170).

### 6. Sistema de Respaldos Resiliente (Backup Microservicio)
* Endpoint transaccional de copia de seguridad automatizada (/api/generar-backup) mediante Cron Jobs semanales.
* Extracción y consolidación de expedientes de base de datos desde producción hacia un Object Storage aislado en un entorno de pruebas (Staging), garantizando resiliencia y aislamiento de entornos.

## Stack Tecnológico

### Frontend y Presentación
* **Next.js (v14.2.3):** Framework de desarrollo web basado en React con soporte para renderizado en servidor (SSR) y cliente (CSR) mediante App Router.
* **React (v18):** Biblioteca para el diseño de componentes reactivos e interfaces dinámicas.
* **Tailwind CSS:** Framework CSS basado en clases de utilidad para la implementación de un diseño responsivo y en modo oscuro clínico.
* **Three.js:** Motor de renderizado 3D utilizado para la visualización y rotación en tiempo real del gemelo digital del cubo BLE.
* **Web Bluetooth API:** Protocolo del estándar web para la conexión directa inalámbrica desde el navegador con el microcontrolador del hardware.

### Backend y Lógica del Servidor
* **Next.js Route Handlers:** Lógica del servidor (endpoints API) para procesamiento de datos analíticos de fatiga y procesamiento transaccional.
* **Vercel Cron Jobs:** Sistema de programación de tareas del servidor para la ejecución del respaldo automatizado semanal.

### Base de Datos y Backend-as-a-Service
* **Supabase:** Plataforma Backend-as-a-Service para la gestión de la infraestructura en la nube:
  * **PostgreSQL:** Base de datos relacional para el almacenamiento de pacientes, historiales y telemetrías.
  * **Supabase Realtime (WebSockets):** Canalización bidireccional de baja latencia para la transmisión de presencia y eventos de telemetría remota.
  * **Supabase Storage:** Servicio de almacenamiento en la nube (Object Storage) para los respaldos cifrados y consolidados en formato JSON.

### Integración de Hardware y Simulación Local
* **ESP32 (BLE & IMU):** Microcontrolador con conectividad Bluetooth Low Energy y sensor de unidad de medición inercial para lectura del movimiento físico.
* **Python (v3):** Scripts locales de control y bridge para la simulación física de teclas y comunicación serial:
  * `cube_keys.py`: Permite mapear las rotaciones del cubo BLE a entradas de teclado del sistema operativo.
  * `cube_bridge.py` / `cube_server.py`: Bridge de red local para simulaciones bimanuales y validaciones de latencia.

## Estructura del Proyecto
```
Producto/
├── app/                  # Rutas principales y páginas de Next.js (App Router)
│   ├── api/              # Endpoints del backend (Generación de backups, reportes e informes)
│   ├── dashboard/        # Panel de control de telemetría y diagnóstico local del cubo
│   ├── evaluador/        # Vista rápida para el especialista clínico (Excel Gold Standard)
│   ├── export/           # Sala de control clínico y generación de PDF/Excel
│   ├── login/            # Sistema de autenticación de contingencia y control de accesos
│   ├── patients/         # Perfiles clínicos longitudinales de pacientes
│   ├── reaction-game/    # Interfaz de juego para Reaction Mirror (Local)
│   ├── remote-eval/      # Interfaz de juego para el paciente a distancia (Magic Links)
│   └── simon-game/       # Interfaz de juego para Memory Mirror (Local)
├── components/           # Componentes visuales y de renderizado 3D
├── contexts/             # Manejadores de estado global (Bluetooth, Auth, CubeState)
├── hooks/                # Hooks personalizados de base de datos offline/online
├── public/               # Recursos estáticos
├── scripts/              # Utilidades de simulación en Python y JS de desarrollo
└── utils/                # Clientes y configuraciones de servicios externos
```

## Instrucciones de Instalación y Ejecución Local

### Prerrequisitos
* Node.js (versión 18 o superior)
* npm (gestor de paquetes de Node)

### Paso 1: Configurar Variables de Entorno
Cree un archivo `.env.local` en la raíz de la carpeta `Producto` y configure las credenciales de Supabase del proyecto activo:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Credenciales de almacenamiento aislado para backups (Staging)
BACKUP_TARGET_SUPABASE_URL=https://tu-proyecto-staging.supabase.co
BACKUP_TARGET_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-staging
```

### Paso 2: Instalar Dependencias
En la carpeta raíz del proyecto, ejecute:
```bash
npm install
```

### Paso 3: Iniciar Servidor de Desarrollo
Para arrancar el servidor web local, ejecute:
```bash
npm run dev
```
La aplicación web estará accesible a través del puerto asignado (típicamente `http://localhost:3000` o `http://localhost:3001`).

### Paso 4: Ejecutar Simulador del Cubo (Opcional)
Si desea realizar pruebas de escritorio sin el hardware físico, puede ejecutar el script de mapeo de teclado:
```bash
python scripts/cube_keys.py
```
Este script permite simular las rotaciones físicas del cubo interactivo mediante el mapeo de teclas bimanuales en el test (`A` para cara izquierda, `L` para cara derecha).

## Seguridad y Privacidad
El sistema adhiere a la Ley N° 19.628 sobre Protección de la Vida Privada (Chile):
* **Consentimiento Clínico:** Antes de iniciar cualquier evaluación oficial, el sistema requiere la aceptación explícita de términos.
* **Magic Links Efímeros:** Los tokens para evaluaciones remotas poseen una duración de 24 horas y se invalidan de forma inmediata una vez completado el test para proteger la rigurosidad y confidencialidad.
* **Separación de Entornos:** Los respaldos clínicos se envían al almacenamiento del entorno de pruebas de forma cifrada, previniendo que una eventual corrupción del sistema de producción comprometa los resguardos.
