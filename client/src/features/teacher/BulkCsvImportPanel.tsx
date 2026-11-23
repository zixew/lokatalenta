import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { parseQuestionsCsv, SAMPLE_QUESTIONS_CSV_TEMPLATE } from './csvQuestionParser';

interface BulkCsvImportPanelProps {
  selectedQuizId: string;
  onImported: (count: number) => void;
  onError: (msg: string) => void;
}

export function BulkCsvImportPanel({ selectedQuizId, onImported, onError }: BulkCsvImportPanelProps) {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');

  const parsed = useMemo(() => {
    if (!csvText.trim()) return { questions: [], errors: [] };
    return parseQuestionsCsv(csvText);
  }, [csvText]);

  const importMutation = useMutation({
    mutationFn: async () => {
      for (const q of parsed.questions) {
        await lmsApi.addQuestionToQuiz(selectedQuizId, {
          category_tag: q.category_tag,
          question_text: q.question_text,
          image_url: null,
          audio_text: null,
          audio_lang: null,
          options: q.options,
          correct_option: q.correct_option,
          explanation: q.explanation,
        });
      }
      return parsed.questions.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-quiz-meta', selectedQuizId] });
      setCsvText('');
      onImported(count);
    },
    onError: (err: Error) => {
      onError(err.message || 'Gagal mengimpor soal CSV.');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_QUESTIONS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-bank-soal.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0F766E]" />
            Bulk Import Soal (CSV + Live Preview)
          </h3>
          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
            Format kolom: category_tag, question_text, option_a..e, correct_option, explanation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setCsvText(SAMPLE_QUESTIONS_CSV_TEMPLATE)}>
            Isi Contoh CSV
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleDownloadTemplate}>
            Unduh Template
          </Button>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-xs font-semibold text-[#18181B] dark:text-white hover:bg-[#F6F5F1] dark:hover:bg-slate-800 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Pilih File .CSV
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      <textarea
        rows={5}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={SAMPLE_QUESTIONS_CSV_TEMPLATE}
        className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 bg-[#FBFBF9] dark:bg-slate-900 font-mono text-xs text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
      />

      {parsed.errors.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-1">
          {parsed.errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {parsed.questions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#18181B] dark:text-white">
              Live Preview ({parsed.questions.length} soal valid siap impor)
            </span>
            <Badge tone="emerald">{parsed.questions.length} Valid</Badge>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {parsed.questions.map((q, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 text-xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone="slate">{q.category_tag}</Badge>
                  <Badge tone="blue">Kunci: {q.correct_option}</Badge>
                </div>
                <p className="font-medium text-[#18181B] dark:text-white line-clamp-2">{q.question_text}</p>
              </div>
            ))}
          </div>
          <Button
            type="button"
            disabled={!selectedQuizId || importMutation.isPending || parsed.errors.length > 0}
            onClick={() => importMutation.mutate()}
          >
            {importMutation.isPending
              ? 'Mengimpor...'
              : `Impor ${parsed.questions.length} Soal ke Bank Soal`}
          </Button>
        </div>
      )}
    </div>
  );
}
