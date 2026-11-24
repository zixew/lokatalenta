import { CheckCircle2, Database, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import {
  executeClientSql,
  isSqlMissionPassed,
  SQL_SANDBOX_TABLES,
  SQL_SCENARIOS,
  type SqlExecutionResult,
} from './sqlSandboxEngine';

export function InteractiveSqlLab() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SQL_SCENARIOS[scenarioIdx] ?? SQL_SCENARIOS[0];
  const [query, setQuery] = useState(scenario.starterQuery);
  const [result, setResult] = useState<SqlExecutionResult>(() =>
    executeClientSql(scenario.starterQuery)
  );

  const schema = SQL_SANDBOX_TABLES[scenario.tableName];
  const passed = isSqlMissionPassed(result, scenario);

  const handleSelectScenario = (idx: number) => {
    const next = SQL_SCENARIOS[idx] ?? SQL_SCENARIOS[0];
    setScenarioIdx(idx);
    setQuery(next.starterQuery);
    setResult(executeClientSql(next.starterQuery));
  };

  const handleRun = () => {
    setResult(executeClientSql(query));
  };

  return (
    <div className="space-y-4">
      {/* Scenario Selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SQL_SCENARIOS.map((sc, idx) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => handleSelectScenario(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              scenarioIdx === idx
                ? 'bg-[#0F766E] text-white'
                : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {idx + 1}. {sc.title}
          </button>
        ))}
      </div>

      {/* Mission Box */}
      <div
        className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          passed
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-[#F6F5F1] dark:bg-slate-900 border-[#E5E3DC] dark:border-slate-800 text-[#18181B] dark:text-slate-200'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 font-bold">
            {passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Database className="w-4 h-4 text-[#0F766E] shrink-0" />
            )}
            <span>
              {passed ? 'Misi Query Tepat!' : `Misi: ${scenario.mission}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setQuery(scenario.solutionQuery);
              setResult(executeClientSql(scenario.solutionQuery));
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Isi Contoh Query
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery(scenario.starterQuery);
              setResult(executeClientSql(scenario.starterQuery));
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Schema Reference Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#71717A] dark:text-slate-400">
        <span className="font-semibold text-[#18181B] dark:text-slate-200">
          Tabel <code className="font-mono-tabular">{schema.name}</code>:
        </span>
        {schema.columns.map((col) => (
          <button
            key={col}
            type="button"
            onClick={() => setQuery((q) => `${q}${q.endsWith(' ') ? '' : ' '}${col}`)}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-[#18181B] dark:text-slate-200 font-mono-tabular cursor-pointer"
            title={`Sisipkan kolom ${col}`}
          >
            {col}
          </button>
        ))}
      </div>

      {/* SQL Editor */}
      <div className="space-y-2">
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleRun();
            }
          }}
          placeholder="Tulis query SELECT ... FROM karyawan ..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 font-mono-tabular text-xs text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#71717A] dark:text-slate-400">
            Sandbox client-side aman (hanya <code className="font-mono-tabular">SELECT</code>)
          </span>
          <Button size="sm" onClick={handleRun}>
            <Play className="w-3.5 h-3.5" />
            Jalankan Query
          </Button>
        </div>
      </div>

      {/* Output Table or Error */}
      {!result.ok ? (
        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300">
          {result.error}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge tone="slate">{result.rows.length} baris dikembalikan</Badge>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#E5E3DC] dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F5F1] dark:bg-slate-900 border-b border-[#E5E3DC] dark:border-slate-800 text-[#71717A] dark:text-slate-400">
                <tr>
                  {result.columns.map((col) => (
                    <th key={col} className="px-3.5 py-2 font-mono-tabular font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                {result.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(1, result.columns.length)}
                      className="px-3.5 py-4 text-center text-[#71717A]"
                    >
                      Tidak ada baris yang cocok dengan filter WHERE.
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row, idx) => (
                    <tr key={idx} className="bg-white dark:bg-[#161B22]">
                      {result.columns.map((col) => (
                        <td
                          key={col}
                          className="px-3.5 py-2 font-mono-tabular text-[#18181B] dark:text-slate-200"
                        >
                          {typeof row[col] === 'number' && col === 'gaji'
                            ? `Rp ${Number(row[col]).toLocaleString('id-ID')}`
                            : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
