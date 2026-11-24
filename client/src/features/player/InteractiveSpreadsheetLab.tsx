import { CheckCircle2, RotateCcw, Sparkles, Table2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import {
  evaluateCell,
  SPREADSHEET_SCENARIOS,
  type SpreadsheetCells,
} from './spreadsheetEngine';

interface InteractiveSpreadsheetLabProps {
  defaultExpanded?: boolean;
}

export function InteractiveSpreadsheetLab({
  defaultExpanded = false,
}: InteractiveSpreadsheetLabProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SPREADSHEET_SCENARIOS[scenarioIdx];

  const [cells, setCells] = useState<SpreadsheetCells>(() => ({ ...scenario.initialCells }));
  const [selectedCell, setSelectedCell] = useState<string>(scenario.targetCell);

  const selectScenario = (idx: number) => {
    const next = SPREADSHEET_SCENARIOS[idx];
    setScenarioIdx(idx);
    setCells({ ...next.initialCells });
    setSelectedCell(next.targetCell);
  };

  const targetRaw = (cells[scenario.targetCell] ?? '').trim();
  const targetEvaluated = evaluateCell(scenario.targetCell, cells);
  const isTargetCorrect =
    targetRaw.startsWith('=') &&
    String(targetEvaluated).trim().toLowerCase() ===
      String(scenario.expectedValue).trim().toLowerCase();

  return (
    <div className="rounded-2xl border border-[#E5E3DC] dark:border-slate-800 bg-white dark:bg-[#161B22] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-[#0F766E]" />
          <h3 className="text-sm font-bold text-[#18181B] dark:text-white">
            Lab Spreadsheet &amp; Rumus Excel Interaktif
          </h3>
          <Badge tone="emerald">Hands-On</Badge>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Tutup Lab Excel' : 'Coba Langsung Rumus'}
        </Button>
      </div>

      {!expanded ? (
        <p className="text-xs text-[#52525B] dark:text-slate-400">
          Praktikkan langsung rumus <code>=SUM</code>, <code>=AVERAGE</code>, <code>=IF</code>, dan{' '}
          <code>=VLOOKUP</code> pada tabel spreadsheet interaktif tanpa perlu keluar dari materi.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Scenario Picker */}
          <div className="flex flex-wrap gap-1.5">
            {SPREADSHEET_SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => selectScenario(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  scenarioIdx === idx
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>

          {/* Mission Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isTargetCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : 'bg-[#F6F5F1] dark:bg-slate-900 border-[#E5E3DC] dark:border-slate-800 text-[#18181B] dark:text-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                {isTargetCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Misi Rumus Tepat! ({scenario.targetCell} = {String(targetEvaluated)})
                  </>
                ) : (
                  <span>Misi Praktik: {scenario.instruction}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedCell(scenario.targetCell);
                  setCells((prev) => ({
                    ...prev,
                    [scenario.targetCell]: scenario.sampleFormula,
                  }));
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Isi Contoh Rumus
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => selectScenario(scenarioIdx)}
                title="Reset tabel"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Formula Bar */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-2 rounded-lg bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-700 font-mono-tabular text-xs font-bold text-[#0F766E] dark:text-teal-400 shrink-0">
              {selectedCell} | fx
            </span>
            <input
              type="text"
              aria-label="Formula Bar Excel"
              value={cells[selectedCell] ?? ''}
              onChange={(e) =>
                setCells((prev) => ({ ...prev, [selectedCell]: e.target.value }))
              }
              placeholder="Ketik angka, teks, atau rumus (=SUM(...), =IF(...), =VLOOKUP(...))"
              className="flex-1 px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          {/* Interactive Spreadsheet Grid */}
          <div className="overflow-x-auto rounded-xl border border-[#E5E3DC] dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F6F5F1] dark:bg-slate-900 border-b border-[#E5E3DC] dark:border-slate-800">
                  <th className="w-10 px-2.5 py-2 text-center font-mono-tabular text-[#71717A] border-r border-[#E5E3DC] dark:border-slate-800">
                    #
                  </th>
                  {scenario.cols.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-center font-mono-tabular font-bold text-[#52525B] dark:text-slate-300 border-r last:border-r-0 border-[#E5E3DC] dark:border-slate-800"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: scenario.rows }, (_, rIdx) => {
                  const rowNum = rIdx + 1;
                  return (
                    <tr
                      key={rowNum}
                      className="border-b last:border-b-0 border-[#E5E3DC] dark:border-slate-800"
                    >
                      <td className="px-2.5 py-2 text-center font-mono-tabular font-semibold bg-[#F6F5F1] dark:bg-slate-900 text-[#71717A] border-r border-[#E5E3DC] dark:border-slate-800">
                        {rowNum}
                      </td>
                      {scenario.cols.map((col) => {
                        const cellId = `${col}${rowNum}`;
                        const isSelected = selectedCell === cellId;
                        const isTarget = scenario.targetCell === cellId;
                        const evaluated = evaluateCell(cellId, cells);
                        const displayValue =
                          typeof evaluated === 'number'
                            ? evaluated.toLocaleString('id-ID')
                            : String(evaluated);

                        return (
                          <td
                            key={cellId}
                            onClick={() => setSelectedCell(cellId)}
                            className={`px-3 py-2 border-r last:border-r-0 border-[#E5E3DC] dark:border-slate-800 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-teal-50 dark:bg-teal-950/50 ring-2 ring-inset ring-[#0F766E] font-semibold'
                                : isTarget
                                  ? 'bg-amber-50/70 dark:bg-amber-950/20'
                                  : rowNum === 1
                                    ? 'bg-slate-50/70 dark:bg-slate-900/40 font-bold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <span className="block truncate max-w-[140px]">
                              {displayValue || (isTarget ? 'Isi rumus...' : '')}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
