import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
}

export function SearchablePicker({
  label,
  options,
  value,
  onChange,
  placeholder = 'Cari atau pilih...',
}: {
  label?: string;
  options: PickerOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const selected = options.find((o) => o.id === value) ?? options[0];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sublabel?.toLowerCase().includes(q) ?? false)
      )
    : options;

  return (
    <div ref={containerRef} className="relative space-y-1">
      {label && (
        <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 text-left rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#18181B] dark:text-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-[#0F766E] cursor-pointer"
      >
        <div className="min-w-0">
          <span className="block truncate font-medium">
            {selected ? selected.label : placeholder}
          </span>
          {selected?.sublabel && (
            <span className="block truncate text-[11px] text-[#71717A] dark:text-slate-400">
              {selected.sublabel}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-[#71717A] shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 rounded-xl bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 shadow-xl z-40 overflow-hidden">
          <div className="p-2 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs bg-transparent text-[#18181B] dark:text-white focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-[#F0EFEA] dark:divide-slate-800">
            {filtered.length === 0 ? (
              <p className="p-3 text-xs text-center text-[#71717A] dark:text-slate-400">
                Tidak ada hasil untuk &ldquo;{query}&rdquo;
              </p>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.id === (selected?.id ?? '');
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs hover:bg-[#F6F5F1] dark:hover:bg-slate-800 cursor-pointer ${
                      isSelected ? 'bg-teal-50/70 dark:bg-teal-950/30 font-semibold' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[#18181B] dark:text-white truncate">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="text-[11px] text-[#71717A] dark:text-slate-400 truncate">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
