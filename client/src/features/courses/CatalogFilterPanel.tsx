import { Check, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../shared/ui/Button';

export type ProgramTypeFilter = 'Semua' | 'Kursus' | 'Latihan';

interface CatalogFilterPanelProps {
  activeFilterCount: number;
  selectedType: ProgramTypeFilter;
  selectedCategory: string;
  selectedLevel: string;
  categories: string[];
  categoryCounts: Record<string, number>;
  levels: string[];
  onSelectType: (t: ProgramTypeFilter) => void;
  onSelectCategory: (cat: string) => void;
  onSelectLevel: (lvl: string) => void;
  onReset: () => void;
  onApply?: () => void;
  previewCount?: number;
  hasPendingChanges?: boolean;
}

export function CatalogFilterPanel({
  activeFilterCount,
  selectedType,
  selectedCategory,
  selectedLevel,
  categories,
  categoryCounts,
  levels,
  onSelectType,
  onSelectCategory,
  onSelectLevel,
  onReset,
  onApply,
  previewCount,
  hasPendingChanges,
}: CatalogFilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4D4CE] dark:border-[#282E3D] pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#18181B] dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F766E]" />
          Filter Program
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-mono font-medium text-[#0F766E] dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Tipe Program */}
      <div className="space-y-2" role="radiogroup" aria-label="Tipe Program">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
          Tipe Program
        </h3>
        <div className="space-y-1.5">
          {(
            [
              { id: 'Semua', label: 'Semua Program' },
              { id: 'Kursus', label: 'Kursus Terstruktur' },
              { id: 'Latihan', label: 'Latihan Soal Langsung' },
            ] as { id: ProgramTypeFilter; label: string }[]
          ).map((t) => {
            const active = selectedType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelectType(t.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-left border ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-[#0F766E] text-[#0F766E] dark:text-teal-300 font-semibold'
                    : 'border-transparent text-[#18181B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                    active
                      ? 'border-[#0F766E] bg-[#0F766E] text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kategori */}
      <div
        className="space-y-2 pt-4 border-t border-[#D4D4CE] dark:border-[#282E3D]"
        role="radiogroup"
        aria-label="Kategori"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
          Kategori
        </h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer border ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-[#0F766E] text-[#0F766E] dark:text-teal-300 font-semibold'
                    : 'border-transparent text-[#52525B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                      active
                        ? 'border-[#0F766E] bg-[#0F766E] text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span className="truncate">{cat === 'Semua' ? 'Semua Kategori' : cat}</span>
                </span>
                <span className="font-mono text-[11px] opacity-80 ml-2 shrink-0">
                  {categoryCounts[cat]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tingkat Kesulitan */}
      <div
        className="space-y-2 pt-4 border-t border-[#D4D4CE] dark:border-[#282E3D]"
        role="radiogroup"
        aria-label="Tingkat Kesulitan"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
          Tingkat Kesulitan
        </h3>
        <div className="space-y-1">
          {levels.map((lvl) => {
            const active = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelectLevel(lvl)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-left border ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-[#0F766E] text-[#0F766E] dark:text-teal-300 font-semibold'
                    : 'border-transparent text-[#18181B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                    active
                      ? 'border-[#0F766E] bg-[#0F766E] text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>{lvl === 'Semua' ? 'Semua Tingkat' : lvl}</span>
              </button>
            );
          })}
        </div>
      </div>

      {onApply && (
        <div className="pt-4 border-t border-[#D4D4CE] dark:border-[#282E3D]">
          <Button
            type="button"
            className="w-full"
            variant={hasPendingChanges ? 'primary' : 'secondary'}
            onClick={onApply}
          >
            Terapkan ({previewCount ?? 0} Program)
          </Button>
        </div>
      )}
    </div>
  );
}
