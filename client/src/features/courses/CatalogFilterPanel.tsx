import { RotateCcw, SlidersHorizontal } from 'lucide-react';

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
}: CatalogFilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E5E3DC] dark:border-slate-800 pb-3">
        <span className="text-sm font-bold text-[#18181B] dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0F766E]" />
          Filter Program
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Tipe Program */}
      <div className="space-y-2.5">
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
          ).map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2.5 text-sm text-[#18181B] dark:text-slate-200 cursor-pointer py-1"
            >
              <input
                type="radio"
                name="programType"
                checked={selectedType === t.id}
                onChange={() => onSelectType(t.id)}
                className="w-4 h-4 accent-[#0F766E] cursor-pointer"
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Kategori */}
      <div className="space-y-2.5 pt-4 border-t border-[#E5E3DC] dark:border-slate-800">
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
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 font-semibold'
                    : 'text-[#52525B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{cat === 'Semua' ? 'Semua Kategori' : cat}</span>
                <span className="font-mono-tabular text-[11px] opacity-80 ml-2 shrink-0">
                  {categoryCounts[cat]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tingkat Kesulitan */}
      <div className="space-y-2.5 pt-4 border-t border-[#E5E3DC] dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
          Tingkat Kesulitan
        </h3>
        <div className="space-y-1.5">
          {levels.map((lvl) => (
            <label
              key={lvl}
              className="flex items-center gap-2.5 text-sm text-[#18181B] dark:text-slate-200 cursor-pointer py-1"
            >
              <input
                type="radio"
                name="courseLevel"
                checked={selectedLevel === lvl}
                onChange={() => onSelectLevel(lvl)}
                className="w-4 h-4 accent-[#0F766E] cursor-pointer"
              />
              <span>{lvl === 'Semua' ? 'Semua Tingkat' : lvl}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
