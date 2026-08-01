import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../../data/firebase';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';

export type CognitiveSummary = {
  accuracy: number;
  avgRT: number;
  maxSpan: number;
  fatigue: number;
  selfCorrectionRate: number;
  fluency: number;
  scoreMax: number;
  scoreAvg: number;
  errorRate: number;
  retryCount: number;
};

export type TrendPoint = {
  date: string;
  accuracy: number;
  avgRT: number;
};

export function useCognitiveMetrics(params: { userId: string; gameId?: string }) {
  const { userId, gameId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CognitiveSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [filteredSessionsCount, setFilteredSessionsCount] = useState<number>(0);
  const [totalSessionsAll, setTotalSessionsAll] = useState<number>(0);
  const [perGameCounts, setPerGameCounts] = useState<Record<string, number>>({});
  const unsubRef = useRef<() => void>();

  const filters = useMemo(() => ({ userId, gameId }), [userId, gameId]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = undefined;
    }

    const sessionsRef = collection(db, 'analysisGameSessions');
    const clauses = [where('userId', '==', filters.userId)];
    if (filters.gameId) clauses.push(where('gameId', '==', filters.gameId));
    const q = query(sessionsRef, ...clauses, orderBy('startTime', 'asc'));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const computed = computeFromSessions(docs);
        setFilteredSessionsCount(docs.length);
        setSummary(computed.summary);
        setTrend(computed.trend);
        setLoading(false);
        try {
          await cacheSummary(filters.userId, filters.gameId, computed.summary);
        } catch {}
      },
      async (err) => {
        setError(err.message || 'snapshot error');
        try {
          const fallback = await getDocs(query(sessionsRef, ...clauses));
          const docs = fallback.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          const computed = computeFromSessions(docs);
          setFilteredSessionsCount(docs.length);
          setSummary(computed.summary);
          setTrend(computed.trend);
          setError(null);
        } catch (e: any) {
          setError(e?.message || 'query error');
        } finally {
          setLoading(false);
        }
      }
    );

    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [filters.userId, filters.gameId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cached = await getCachedSummary(userId, gameId);
        if (mounted && cached) setSummary(cached);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [userId, gameId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const qAll = query(collection(db, 'analysisGameSessions'), where('userId', '==', userId));
        const snap = await getDocs(qAll);
        if (!active) return;
        setTotalSessionsAll(snap.size);
        const counts: Record<string, number> = {};
        snap.forEach((doc) => {
          const g = (doc.data() as any).gameId || 'unknown';
          counts[g] = (counts[g] || 0) + 1;
        });
        setPerGameCounts(counts);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return { loading, error, metrics: summary, trend, filteredSessionsCount, totalSessions: totalSessionsAll, perGameCounts } as const;
}

function computeFromSessions(sessions: any[]) {
  const sessionPoints: { accuracy: number; avgRT: number; maxSpan: number; date: string; selfCorrectionRate: number; fluency: number; score?: number; gameId?: string; errorRate?: number }[] = [];

  sessions.forEach((s) => {
    const metrics = s.metrics || {};
    const taps: any[] = Array.isArray(s.allTaps) ? s.allTaps : [];
    const ts = typeof s.startTime === 'string' ? new Date(s.startTime).getTime() : s.startTime || Date.now();
    const date = new Date(ts).toLocaleDateString('es-ES');

    let accuracy = 0;
    if (typeof metrics.errorRate === 'number') accuracy = Math.max(0, Math.min(100, 100 - metrics.errorRate));
    else if (taps.length > 0) {
      const correct = taps.filter((t) => t.isCorrect).length;
      accuracy = (correct / taps.length) * 100;
    }

    let avgRT = 0;
    if (taps.length > 1) {
      const diffs: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        const dt = (taps[i].timestamp ?? 0) - (taps[i - 1].timestamp ?? 0);
        if (Number.isFinite(dt) && dt >= 0) diffs.push(dt);
      }
      avgRT = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
    }

    const maxSpan = typeof metrics.maxSpan === 'number' ? metrics.maxSpan : 0;

    let selfCorrectionRate = 0;
    if (taps.length > 1) {
      let transitions = 0;
      let incorrectToCorrect = 0;
      for (let i = 1; i < taps.length; i++) {
        const prev = taps[i - 1];
        const curr = taps[i];
        if (prev.isCorrect === false) {
          transitions++;
          if (curr.isCorrect === true) incorrectToCorrect++;
        }
      }
      selfCorrectionRate = transitions ? incorrectToCorrect / transitions : 0;
    }

    let fluency = 0;
    if (typeof metrics.cognitiveFluency === 'number') fluency = metrics.cognitiveFluency;
    else fluency = Math.max(0, accuracy * 10 - (avgRT / 100));

    const score = typeof metrics.score === 'number' ? metrics.score : undefined;
    const errorRate = typeof metrics.errorRate === 'number' ? metrics.errorRate : Math.max(0, 100 - accuracy);
    sessionPoints.push({ accuracy, avgRT, maxSpan, date, selfCorrectionRate, fluency, score, gameId: s.gameId, errorRate });
  });

  const fatigue = computeSlope(sessionPoints.map((p) => p.accuracy));
  const scores = sessionPoints.map((p) => p.score).filter((v): v is number => typeof v === 'number');
  const scoreMax = scores.length ? Math.max(...scores) : 0;
  const scoreAvg = scores.length ? safeAvg(scores) : 0;
  const errorRate = safeAvg(sessionPoints.map((p) => p.errorRate || 0));

  // reintentos: por juego dentro del set filtrado sum(count-1)
  const byGame = new Map<string, number>();
  sessionPoints.forEach((p) => {
    const g = p.gameId || 'unknown';
    byGame.set(g, (byGame.get(g) || 0) + 1);
  });
  let retryCount = 0;
  byGame.forEach((count) => { retryCount += Math.max(0, count - 1); });

  const summary: CognitiveSummary = {
    accuracy: safeAvg(sessionPoints.map((p) => p.accuracy)),
    avgRT: safeAvg(sessionPoints.map((p) => p.avgRT)),
    maxSpan: Math.max(0, ...sessionPoints.map((p) => p.maxSpan), 0),
    fatigue,
    selfCorrectionRate: safeAvg(sessionPoints.map((p) => p.selfCorrectionRate)),
    fluency: safeAvg(sessionPoints.map((p) => p.fluency)),
    scoreMax,
    scoreAvg,
    errorRate,
    retryCount,
  };

  const trend = sessionPoints.map((p) => ({ date: p.date, accuracy: round(p.accuracy, 1), avgRT: Number((p.avgRT / 1000).toFixed(2)) }));

  return { summary, trend };
}

function computeSlope(values: number[]) {
  if (values.length < 2) return 0;
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i + 1);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = values[i] - meanY;
    num += dx * dy;
    den += dx * dx;
  }
  return den ? num / den : 0;
}

function safeAvg(arr: number[]) {
  const vals = arr.filter((v) => Number.isFinite(v));
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function round(v: number, d = 2) {
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
}

async function cacheSummary(userId: string, gameId: string | undefined, data: CognitiveSummary) {
  const id = gameId ? `${userId}_${gameId}` : userId;
  const ref = doc(db, 'summaryMetrics', id);
  await setDoc(ref, { userId, gameId: gameId || null, ...data, lastUpdated: Date.now() }, { merge: true });
}

async function getCachedSummary(userId: string, gameId?: string) {
  try {
    const id = gameId ? `${userId}_${gameId}` : userId;
    const ref = doc(db, 'summaryMetrics', id);
    const s = await getDoc(ref);
    if (s.exists()) {
      const d = s.data() as any;
      const res: CognitiveSummary = {
        accuracy: d.accuracy ?? 0,
        avgRT: d.avgRT ?? 0,
        maxSpan: d.maxSpan ?? 0,
        fatigue: d.fatigue ?? 0,
        selfCorrectionRate: d.selfCorrectionRate ?? 0,
        fluency: d.fluency ?? 0,
        scoreMax: d.scoreMax ?? 0,
        scoreAvg: d.scoreAvg ?? 0,
        errorRate: d.errorRate ?? (typeof d.accuracy === 'number' ? Math.max(0, 100 - d.accuracy) : 0),
        retryCount: d.retryCount ?? 0,
      };
      return res;
    }
  } catch {}
  return null;
}
