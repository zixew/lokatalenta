import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course, QuizAttempt } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { buildDiagnosticStudyPlan } from './diagnosticStudyPlan';

export function DiagnosticStudyPlanCard({
  attempts,
  courses,
}: {
  attempts: QuizAttempt[];
  courses: Course[];
}) {
  const steps = buildDiagnosticStudyPlan(attempts, courses);

  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#0F766E]" />
            Rencana Belajar Diagnostik (Adaptif)
          </h2>
          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
            Prioritas latihan mingguan disusun otomatis dari subtest terlemah Anda.
          </p>
        </div>
        <Badge tone="emerald">
          <Sparkles className="w-3 h-3" />
          3 Langkah Prioritas
        </Badge>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className="p-4 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono-tabular font-bold text-[#0F766E] dark:text-teal-400">
                  #{idx + 1}
                </span>
                <p className="font-bold text-sm text-[#18181B] dark:text-white truncate">
                  {step.subtest}
                </p>
                <Badge
                  tone={
                    step.priority === 'Tinggi'
                      ? 'rose'
                      : step.priority === 'Sedang'
                        ? 'amber'
                        : 'emerald'
                  }
                >
                  Prioritas {step.priority}
                </Badge>
                {step.scorePct !== null && (
                  <span className="text-xs font-mono-tabular font-semibold text-[#52525B] dark:text-slate-300">
                    Skor: {step.scorePct}%
                  </span>
                )}
              </div>
              <p className="text-xs text-[#52525B] dark:text-slate-300">
                {step.recommendation}
              </p>
            </div>
            <Link
              to={step.actionPath}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#0D625B] transition-colors shrink-0 self-start sm:self-center"
            >
              {step.actionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
