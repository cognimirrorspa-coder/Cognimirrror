import { Timestamp } from 'firebase/firestore';

// Generate demo sessions for Lucas spanning 3-6 months
export const generateDemoSessions = () => {
    const sessions = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 5); // 5 months ago

    // Generate 45 sessions over 5 months
    const totalSessions = 45;
    const daysSpan = 150; // ~5 months

    for (let i = 0; i < totalSessions; i++) {
        // Distribute sessions over time with some randomness
        const daysAgo = Math.floor((daysSpan / totalSessions) * (totalSessions - i)) + Math.random() * 3;
        const sessionDate = new Date(now);
        sessionDate.setDate(sessionDate.getDate() - daysAgo);
        sessionDate.setHours(Math.floor(Math.random() * 12) + 9); // Between 9am and 9pm
        sessionDate.setMinutes(Math.floor(Math.random() * 60));

        // Alternate between games with some randomness
        const isMemoryMirror = Math.random() > 0.45; // Slightly favor Memory Mirror
        const gameId = isMemoryMirror ? 'memory_mirror' : 'digit_span_v1';

        // Progression over time - user gets better
        const progressFactor = i / totalSessions;

        // Base level increases over time
        const baseLevel = isMemoryMirror
            ? Math.floor(3 + progressFactor * 4) // 3 to 7
            : Math.floor(3 + progressFactor * 3); // 3 to 6

        const nivel_maximo = baseLevel + (Math.random() > 0.7 ? 1 : 0);

        // Error rate decreases over time
        const baseErrorRate = 35 - (progressFactor * 20); // 35% to 15%
        const tasa_error = Math.max(5, Math.min(50, baseErrorRate + (Math.random() - 0.5) * 15));

        // Persistence increases over time
        const basePersistence = 3 + (progressFactor * 4); // 3 to 7 attempts
        const persistencia_intentos = Math.floor(basePersistence + (Math.random() - 0.3) * 2);

        // Calculate hits and errors based on level and error rate
        const totalAttempts = Math.floor(10 + progressFactor * 15); // 10 to 25 attempts
        const errores = Math.floor((totalAttempts * tasa_error) / 100);
        const aciertos = totalAttempts - errores;

        // Duration increases slightly with complexity
        const duracion_segundos = Math.floor(120 + nivel_maximo * 30 + Math.random() * 60);

        // Most sessions are completed, especially later ones
        const completada = Math.random() > (0.3 - progressFactor * 0.25);

        sessions.push({
            id: `demo-session-${i + 1}`,
            fecha: Timestamp.fromDate(sessionDate),
            gameId,
            duracion_segundos,
            nivel_maximo,
            aciertos,
            errores,
            tasa_error: parseFloat(tasa_error.toFixed(1)),
            persistencia_intentos: Math.max(1, persistencia_intentos),
            completada
        });
    }

    // Sort by date ascending (oldest first)
    return sessions.sort((a, b) => a.fecha.toMillis() - b.fecha.toMillis());
};

// Pre-generate the sessions so they're consistent
export const demoSessions = generateDemoSessions();
