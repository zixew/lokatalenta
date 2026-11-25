import { ArrowRight, Calendar, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import {
  type AgendaCategory,
  type StudyAgendaItem,
  buildIcsCalendarEvent,
} from './studyAgenda';

interface StudyAgendaCardProps {
  items: StudyAgendaItem[];
}

export function StudyAgendaCard({ items }: StudyAgendaCardProps) {
  const [filter, setFilter] = useState<'all' | AgendaCategory>('all');

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  const handleDownloadIcs = (item: StudyAgendaItem) => {
    const ics = buildIcsCalendarEvent(item);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0F766E]" />
            Agenda &amp; Tenggat Terdekat
          </h2>
          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
            Jadwal Tryout Akbar, kelas Cohort, dan kursus aktif Anda dalam satu timeline.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'tryout', label: 'Tryout' },
              { id: 'cohort', label: 'Cohort' },
              { id: 'course', label: 'Kursus' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                filter === f.id
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#71717A] dark:text-slate-400">
          Belum ada agenda terdekat untuk filter ini.{' '}
          <Link to="/tryout" className="text-[#0F766E] font-semibold hover:underline">
            Lihat Jadwal Tryout
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900 border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.urgency === 'live'
                  ? 'border-l-rose-500'
                  : item.urgency === 'soon'
                    ? 'border-l-amber-500'
                    : 'border-l-[#0F766E]'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      item.urgency === 'live'
                        ? 'rose'
                        : item.urgency === 'soon'
                          ? 'amber'
                          : 'blue'
                    }
                  >
                    {item.badgeLabel}
                  </Badge>
                  <span className="text-[11px] font-mono-tabular text-[#71717A] dark:text-slate-400">
                    {new Date(item.scheduledAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#18181B] dark:text-white truncate">
                  {item.title}
                </p>
                <p className="text-xs text-[#71717A] dark:text-slate-400">{item.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Tambahkan ke Kalender (.ics)"
                  onClick={() => handleDownloadIcs(item)}
                >
                  <CalendarPlus className="w-4 h-4" />
                </Button>
                <Link to={item.actionPath}>
                  <Button variant="secondary" size="sm">
                    {item.actionLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
