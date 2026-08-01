export function analyzeData(turns = []) {
  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  let rightRTs = [], leftRTs = [];
  let falseStartR = 0, falseStartL = 0;
  let falseStartCount = 0, commissionCount = 0, omissionCount = 0;
  let shortWaitRTs = [], longWaitRTs = [];
  let chronologicalRTs = [];

  turns.forEach((t) => {
    const isNogoFail = t.type === 'NOGO' ? t.fail : t.isFalseStart;
    const isNogoSuccess = t.type === 'NOGO' ? !t.fail : (t.expectedFace && t.expectedFace !== 'L' && t.expectedFace !== 'R' && !t.isFalseStart);
    const isGoOmission = t.type === 'GO' ? t.timeout : (t.isOmission && (t.expectedFace === 'L' || t.expectedFace === 'R'));
    const isCommission = t.type === 'GO' ? t.errors > 0 : (t.firstMoveWrong && !t.isFalseStart && !t.isOmission);
    
    const actualF = t.actualFace || t.expected;

    if (isNogoFail) {
      falseStartCount++;
      if (actualF === 'R') falseStartR++;
      if (actualF === 'L') falseStartL++;
    }
    if (isGoOmission) omissionCount++;
    if (isCommission) commissionCount++;

    const rt = t.time || t.reactionTimeMs;
    const isCorr = t.type ? (t.status === 'Ok' || t.status === 'Corregido') : t.isCorrect;
    const expectedF = t.expected || t.expectedFace;

    if (isCorr && rt > 0 && t.type !== 'NOGO') {
      chronologicalRTs.push(rt);
      if (expectedF === 'R') rightRTs.push(rt);
      if (expectedF === 'L') leftRTs.push(rt);

      const waitTime = t.waitTimeMs || 1000;
      if (waitTime < 1800) shortWaitRTs.push(rt);
      else longWaitRTs.push(rt);
    }
  });

  const impulsivityErrors = falseStartCount + omissionCount + commissionCount;

  let avgRight = rightRTs.length ? avg(rightRTs) : null;
  let avgLeft  = leftRTs.length  ? avg(leftRTs)  : null;

  const adjRight = avgRight !== null ? avgRight - falseStartR * 25 : null;
  const adjLeft  = avgLeft  !== null ? avgLeft  - falseStartL * 25 : null;

  let dominance = 'Indeterminada', dominanceIcon = '⚖️';
  let instinctHand = null;

  if (adjRight !== null && adjLeft !== null) {
    if (adjRight + 30 < adjLeft) { dominance = 'Derecha'; dominanceIcon = '👉'; }
    else if (adjLeft + 30 < adjRight) { dominance = 'Izquierda'; dominanceIcon = '👈'; }
    else { dominance = 'Ambidiestra'; dominanceIcon = '👐'; }
  } else if (adjRight !== null) {
    dominance = 'Derecha'; dominanceIcon = '👉';
  } else if (adjLeft !== null) {
    dominance = 'Izquierda'; dominanceIcon = '👈';
  }

  if (falseStartR > falseStartL) instinctHand = 'Derecha';
  else if (falseStartL > falseStartR) instinctHand = 'Izquierda';

  let handDiffText = null;
  if (avgRight !== null && avgLeft !== null) {
    const diff = Math.abs(avgRight - avgLeft);
    const faster = avgRight < avgLeft ? 'Derecha (Naranja)' : 'Izquierda (Roja)';
    handDiffText = `Tu mano ${faster} fue ${diff} ms más rápida en promedio.`;
    if (instinctHand) {
      handDiffText += ` Además, tu instinto motor fue usar la mano ${instinctHand}.`;
    }
  } else if (instinctHand) {
    handDiffText = `Solo respondiste correctamente a un lado. Tu instinto apuntó a la mano ${instinctHand}.`;
  }

  // 3. Delta de Asimetría Motriz (Lateralidad)
  let asymmetryDelta = null;
  let asymmetryLevel = 'Normal';
  let asymmetryColor = 'text-slate-600';
  if (avgRight !== null && avgLeft !== null) {
    asymmetryDelta = Math.abs(avgRight - avgLeft);
    if (asymmetryDelta > 300) {
      asymmetryLevel = 'Asimetría Atípica (Alerta)';
      asymmetryColor = 'text-rose-600';
    } else if (asymmetryDelta > 150) {
      asymmetryLevel = 'Diferencia Leve';
      asymmetryColor = 'text-amber-600';
    } else {
      asymmetryLevel = 'Equilibrio Bilateral';
      asymmetryColor = 'text-emerald-600';
    }
  }

  const allRTs = [...rightRTs, ...leftRTs];
  const avgTotal = avg(allRTs);
  let speedCategory = 'Lento';
  if (avgTotal > 0 && avgTotal < 300) speedCategory = 'Notable';
  else if (avgTotal <= 450) speedCategory = 'Normal';

  // 1. Variabilidad Intraindividual (SD)
  let stdDev = 0;
  if (allRTs.length > 1) {
    const variance = allRTs.reduce((sum, rt) => sum + Math.pow(rt - avgTotal, 2), 0) / (allRTs.length - 1);
    stdDev = Math.round(Math.sqrt(variance));
  }
  let consistencyLevel = 'Alta Consistencia';
  let consistencyColor = 'text-emerald-600';
  let consistencyIcon = '🎯';
  if (stdDev > 250) {
    consistencyLevel = 'Inconsistencia Severa (Alerta)';
    consistencyColor = 'text-rose-600';
    consistencyIcon = '🚩';
  } else if (stdDev > 150) {
    consistencyLevel = 'Variabilidad Moderada';
    consistencyColor = 'text-amber-600';
    consistencyIcon = '⚠️';
  }

  const consistenciaData = chronologicalRTs.map((rt, i) => ({
    name: `T${i+1}`,
    rt: rt,
    avg: avgTotal
  }));

  // 2. Fatiga Cognitiva
  let fatiguePercent = 0;
  let fatigueLevel = 'Sin fatiga evidente';
  let fatigueColor = 'text-emerald-600';
  let avgFirstHalf = 0, avgSecondHalf = 0;
  let fatigaData = [];

  if (chronologicalRTs.length >= 4) {
    const mid = Math.floor(chronologicalRTs.length / 2);
    const m1 = chronologicalRTs.slice(0, mid);
    const m2 = chronologicalRTs.slice(mid);
    avgFirstHalf = avg(m1);
    avgSecondHalf = avg(m2);
    
    const maxLen = Math.max(m1.length, m2.length);
    for (let i = 0; i < maxLen; i++) {
      fatigaData.push({
        name: `Turno ${i+1}`,
        m1: m1[i] || null,
        m2: m2[i] || null
      });
    }
    
    if (avgFirstHalf > 0) {
      fatiguePercent = Math.round(((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100);
      if (fatiguePercent >= 30) {
        fatigueLevel = 'Fatiga Cognitiva Severa';
        fatigueColor = 'text-rose-600';
      } else if (fatiguePercent >= 15) {
        fatigueLevel = 'Decaimiento de Vigilancia';
        fatigueColor = 'text-amber-600';
      } else if (fatiguePercent < -15) {
        fatigueLevel = 'Aceleración (Aprendizaje)';
        fatigueColor = 'text-indigo-600';
      } else {
        fatigueLevel = 'Vigilancia Estable';
      }
    }
  }

  const avgShort = avg(shortWaitRTs);
  const avgLong  = avg(longWaitRTs);
  let attentionText = '';
  let attentionLevel = 'Sin datos suficientes';

  if (shortWaitRTs.length > 0 && longWaitRTs.length > 0) {
    const delta = avgLong - avgShort;
    attentionLevel = delta > 80 ? 'Fatiga Atencional' : delta > 30 ? 'Leve Dispersión' : 'Foco Sostenido';
    attentionText = `Esperas cortas: ${avgShort} ms. Esperas largas: ${avgLong} ms.`;
  } else {
    attentionLevel = 'Foco Sostenido';
  }

  let controlCategory = 'Moderado';
  let controlColor = 'text-amber-600';
  if (impulsivityErrors === 0) { controlCategory = 'Excelente'; controlColor = 'text-emerald-600'; }  
  else if (impulsivityErrors >= 4) { controlCategory = 'Bajo'; controlColor = 'text-rose-600'; }

  return {
    avgTotal, avgRight, avgLeft, handDiffText, dominance, dominanceIcon,
    speedCategory, attentionLevel, attentionText,
    avgShort: shortWaitRTs.length ? avgShort : null,
    avgLong:  longWaitRTs.length  ? avgLong  : null,
    controlCategory, controlColor,
    falseStartCount, commissionCount, omissionCount, impulsivityErrors,
    stdDev, consistencyLevel, consistencyColor, consistencyIcon, consistenciaData,
    fatiguePercent, fatigueLevel, fatigueColor, avgFirstHalf, avgSecondHalf, fatigaData,
    asymmetryDelta, asymmetryLevel, asymmetryColor
  };
}

export function calcPostInhibitorySlow(turns, globalGoAvg) {
  let postSuccessDiffs = [];
  let postErrorDiffs = [];

  for (let i = 0; i < turns.length - 1; i++) {
    const t = turns[i];
    const isNoGo = t.type === 'NOGO' || (t.expectedFace && t.expectedFace !== 'L' && t.expectedFace !== 'R');
    
    if (isNoGo) {
      const nextTurn = turns[i+1];
      const nextIsGo = nextTurn.type === 'GO' || (nextTurn.expectedFace === 'L' || nextTurn.expectedFace === 'R');
      const nextRT = nextTurn.time || nextTurn.reactionTimeMs;
      
      if (nextIsGo && nextRT > 0) {
        const diff = nextRT - globalGoAvg;
        const nogoSuccess = t.type === 'NOGO' ? !t.fail : (!t.isFalseStart && t.isOmission); 
        
        if (nogoSuccess) postSuccessDiffs.push(diff);
        else postErrorDiffs.push(diff);
      }
    }
  }

  const avgSuccess = postSuccessDiffs.length ? Math.round(postSuccessDiffs.reduce((a,b)=>a+b,0)/postSuccessDiffs.length) : null;
  const avgError = postErrorDiffs.length ? Math.round(postErrorDiffs.reduce((a,b)=>a+b,0)/postErrorDiffs.length) : null;

  let interpretation = '';
  if (avgSuccess !== null && avgSuccess > 50) interpretation += 'Duda post-acierto (+). ';
  else if (avgSuccess !== null && avgSuccess < -50) interpretation += 'Recuperación rápida post-acierto (-). ';
  else if (avgSuccess !== null) interpretation += 'Estable tras inhibir. ';

  if (avgError !== null && avgError > 50) interpretation += 'Sobrecompensación tras error (+).';
  else if (avgError !== null && avgError < -50) interpretation += 'Impulsividad descontrolada tras error (-).';
  else if (avgError !== null) interpretation += 'Estable tras error.';

  return {
    postSuccessSlowing_ms: avgSuccess,
    postErrorSlowing_ms: avgError,
    postSuccessSample: postSuccessDiffs.length,
    postErrorSample: postErrorDiffs.length,
    interpretation: interpretation || 'Sin datos suficientes.'
  };
}
