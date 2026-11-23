import { describe, expect, it } from 'vitest';
import {
  evaluateKraepelinSession,
  expectedPairAnswer,
  generateKraepelinColumns,
  pairKey,
} from '../features/kraepelin/kraepelinEngine';

describe('BL-01 Kraepelin / Pauli Engine', () => {
  it('generates requested columns and digits 1..9', () => {
    const cols = generateKraepelinColumns(8, 12);
    expect(cols).toHaveLength(8);
    for (const col of cols) {
      expect(col).toHaveLength(12);
      for (const n of col) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(9);
      }
    }
  });

  it('computes units-digit answer and evaluates speed, accuracy, and consistency', () => {
    expect(expectedPairAnswer(7, 8)).toBe(5);
    expect(expectedPairAnswer(4, 6)).toBe(0);
    expect(expectedPairAnswer(3, 5)).toBe(8);

    const cols = [
      [2, 5, 9, 4], // pairs: 7, 4, 3
      [8, 7, 6, 5], // pairs: 5, 3, 1
    ];
    const answers: Record<string, number> = {
      [pairKey(0, 0)]: 7, // correct
      [pairKey(0, 1)]: 4, // correct
      [pairKey(0, 2)]: 9, // wrong (expected 3)
      [pairKey(1, 0)]: 5, // correct
      [pairKey(1, 1)]: 3, // correct
    };

    const result = evaluateKraepelinSession(cols, answers);
    expect(result.totalPairs).toBe(6);
    expect(result.totalAttempted).toBe(5);
    expect(result.totalCorrect).toBe(4);
    expect(result.accuracyPct).toBe(80);
    expect(result.avgSpeedPerCol).toBe(2.5);
    expect(result.consistencyPct).toBe(67);
    expect(result.columnStats[0].correct).toBe(2);
    expect(result.columnStats[1].attempted).toBe(2);
  });
});
