import { ChevronDown, ChevronUp, Database, MessageSquareQuote, Table2 } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Badge } from '../../shared/ui/Badge';
import { InteractiveSpreadsheetLab } from './InteractiveSpreadsheetLab';
import { InteractiveSqlLab } from './InteractiveSqlLab';

const StarInterviewLab = lazy(() => import('./StarInterviewLab'));

type LabTab = 'excel' | 'sql' | 'star';

interface HandsOnLabContainerProps {
  defaultLab: LabTab;
  defaultExpanded?: boolean;
}

export function HandsOnLabContainer({
  defaultLab,
  defaultExpanded = false,
}: HandsOnLabContainerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeLab, setActiveLab] = useState<LabTab>(defaultLab);

  return (
    <section className="rounded-2xl border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#D4D4CE] dark:border-[#282E3D] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {activeLab === 'sql' ? (
            <Database className="w-4 h-4 text-[#0F766E]" />
          ) : activeLab === 'star' ? (
            <MessageSquareQuote className="w-4 h-4 text-[#0F766E]" />
          ) : (
            <Table2 className="w-4 h-4 text-[#0F766E]" />
          )}
          <h3 className="text-sm font-bold text-[#18181B] dark:text-white">
            Hands-On Practice Lab
          </h3>
          <Badge tone="emerald">Interaktif</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-[#F4F4F1] dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => {
                setActiveLab('excel');
                setExpanded(true);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                activeLab === 'excel'
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#52525B] dark:text-slate-300'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Lab Excel (fx)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLab('sql');
                setExpanded(true);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                activeLab === 'sql'
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#52525B] dark:text-slate-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Lab SQL (SELECT)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLab('star');
                setExpanded(true);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                activeLab === 'star'
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#52525B] dark:text-slate-300'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              Simulasi STAR
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-2.5 py-1 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] text-xs font-semibold text-[#52525B] dark:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
          >
            {expanded ? (
              <>
                Tutup Lab <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Buka Lab <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5">
          {activeLab === 'excel' ? (
            <InteractiveSpreadsheetLab defaultExpanded />
          ) : activeLab === 'sql' ? (
            <InteractiveSqlLab />
          ) : (
            <Suspense
              fallback={
                <div className="p-6 text-center text-xs text-[#71717A] dark:text-slate-400">
                  Memuat Simulasi Wawancara STAR...
                </div>
              }
            >
              <StarInterviewLab />
            </Suspense>
          )}
        </div>
      )}
    </section>
  );
}
