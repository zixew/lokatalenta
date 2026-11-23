export interface KraepelinColumnStat {
  columnIndex: number;
  attempted: number;
  correct: number;
  totalPairs: number;
  accuracyPct: number;
}

export interface KraepelinEvaluation {
  columnStats: KraepelinColumnStat[];
  totalAttempted: number;
  totalCorrect: number;
  totalPairs: number;
  accuracyPct: number;
  avgSpeedPerCol: number;
  consistencyPct: number;
}

/**
 * Generates Kraepelin/Pauli columns of digits (1-9).
 * Each column has `rowsPerColumn` digits, yielding `rowsPerColumn - 1` adjacent addition pairs.
 */
export function generateKraepelinColumns(
  columnCount = 10,
  rowsPerColumn = 16
): number[][] {
  const safeCols = Math.max(1, columnCount);
  const safeRows = Math.max(2, rowsPerColumn);
  const cols: number[][] = [];
  for (let c = 0; c < safeCols; c += 1) {
    const col: number[] = [];
    for (let r = 0; r < safeRows; r += 1) {
      col.push(Math.floor(Math.random() * 9) + 1);
    }
    cols.push(col);
  }
  return cols;
}

/**
 * Standard Kraepelin/Pauli rule: only the units digit of (a + b) is entered.
 */
export function expectedPairAnswer(a: number, b: number): number {
  return (a + b) % 10;
}

export function pairKey(columnIndex: number, pairIndex: number): string {
  return `${columnIndex}-${pairIndex}`;
}

export function evaluateKraepelinSession(
  columns: number[][],
  answers: Record<string, number>
): KraepelinEvaluation {
  const columnStats: KraepelinColumnStat[] = columns.map((col, colIdx) => {
    const totalPairs = Math.max(0, col.length - 1);
    let attempted = 0;
    let correct = 0;

    for (let p = 0; p < totalPairs; p += 1) {
      const key = pairKey(colIdx, p);
      if (Object.prototype.hasOwnProperty.call(answers, key)) {
        attempted += 1;
        if (answers[key] === expectedPairAnswer(col[p], col[p + 1])) {
          correct += 1;
        }
      }
    }

    const accuracyPct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return {
      columnIndex: colIdx,
      attempted,
      correct,
      totalPairs,
      accuracyPct,
    };
  });

  const totalAttempted = columnStats.reduce((s, c) => s + c.attempted, 0);
  const totalCorrect = columnStats.reduce((s, c) => s + c.correct, 0);
  const totalPairs = columnStats.reduce((s, c) => s + c.totalPairs, 0);
  const accuracyPct = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const avgSpeedPerCol =
    columns.length > 0 ? Number((totalAttempted / columns.length).toFixed(1)) : 0;

  const activeCounts = columnStats.map((c) => c.attempted).filter((n) => n > 0);
  let consistencyPct = 0;
  if (activeCounts.length === 1) {
    consistencyPct = 100;
  } else if (activeCounts.length > 1) {
    const maxCount = Math.max(...activeCounts);
    const minCount = Math.min(...activeCounts);
    consistencyPct = maxCount > 0 ? Math.round((minCount / maxCount) * 100) : 0;
  }

  return {
    columnStats,
    totalAttempted,
    totalCorrect,
    totalPairs,
    accuracyPct,
    avgSpeedPerCol,
    consistencyPct,
  };
}
