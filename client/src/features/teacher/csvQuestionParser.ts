import type { QuizOption } from '../../shared/types/lms';

export interface ParsedCsvQuestion {
  category_tag: string;
  question_text: string;
  options: QuizOption[];
  correct_option: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  question_type?: 'mcq' | 'short_answer';
  accepted_answers?: string[];
}

export interface CsvParseResult {
  questions: ParsedCsvQuestion[];
  errors: string[];
}

export const SAMPLE_QUESTIONS_CSV_TEMPLATE = [
  'category_tag,question_text,option_a,option_b,option_c,option_d,option_e,correct_option,explanation',
  'Verbal,"Sinonim dari kata EPILOG adalah...",Pembuka,Penutup,Prolog,Dialog,Monolog,B,"Epilog berarti bagian penutup karya sastra atau pidato."',
  'Numerik,"Jika 2, 6, 12, 20, 30, ... maka angka selanjutnya adalah?",38,40,42,44,46,C,"Pola selisih bertingkat: +4, +6, +8, +10, +12 -> 30 + 12 = 42."',
].join('\n');

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const VALID_KEYS = new Set(['A', 'B', 'C', 'D', 'E']);

export function parseQuestionsCsv(raw: string): CsvParseResult {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { questions: [], errors: ['Input CSV kosong.'] };
  }

  const questions: ParsedCsvQuestion[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const cols = splitCsvLine(line);
    // Skip header row if detected
    if (index === 0 && cols[0]?.toLowerCase() === 'category_tag') {
      return;
    }

    const rowNum = index + 1;
    if (cols.length < 8) {
      errors.push(`Baris ${rowNum}: minimal 8 kolom (category_tag, question_text, option_a..d, [option_e], correct_option).`);
      return;
    }

    const [
      categoryTag,
      questionText,
      optA,
      optB,
      optC,
      optD,
      optE,
      rawCorrect,
      explanation = '',
      rawQuestionType = '',
      rawAcceptedAnswers = '',
    ] = cols;
    if (!questionText) {
      errors.push(`Baris ${rowNum}: pertanyaan tidak boleh kosong.`);
      return;
    }

    const normalizedType = rawQuestionType.trim().toLowerCase();
    if (normalizedType === 'short_answer') {
      const acceptedList = (rawAcceptedAnswers || rawCorrect || '')
        .split('|')
        .map((ans) => ans.trim())
        .filter((ans) => ans.length > 0);
      if (acceptedList.length === 0) {
        errors.push(
          `Baris ${rowNum}: soal short_answer wajib memiliki accepted_answers (pisahkan dengan |).`
        );
        return;
      }
      questions.push({
        category_tag: categoryTag || 'Umum',
        question_text: questionText,
        options: [],
        correct_option: 'A',
        explanation: explanation || 'Pembahasan belum ditambahkan.',
        question_type: 'short_answer',
        accepted_answers: acceptedList,
      });
      return;
    }

    if (normalizedType && normalizedType !== 'mcq') {
      errors.push(`Baris ${rowNum}: question_type "${rawQuestionType}" harus mcq atau short_answer.`);
      return;
    }

    if (!optA || !optB || !optC || !optD) {
      errors.push(`Baris ${rowNum}: opsi A, B, C, dan D wajib diisi.`);
      return;
    }

    const correctOpt = (rawCorrect ?? '').toUpperCase();
    if (!VALID_KEYS.has(correctOpt)) {
      errors.push(`Baris ${rowNum}: kunci jawaban "${rawCorrect}" harus A, B, C, D, atau E.`);
      return;
    }
    if (correctOpt === 'E' && !optE) {
      errors.push(`Baris ${rowNum}: kunci E dipilih tetapi opsi E kosong.`);
      return;
    }

    const options: QuizOption[] = [
      { key: 'A', text: optA },
      { key: 'B', text: optB },
      { key: 'C', text: optC },
      { key: 'D', text: optD },
      { key: 'E', text: optE || '-' },
    ];

    questions.push({
      category_tag: categoryTag || 'Umum',
      question_text: questionText,
      options,
      correct_option: correctOpt as 'A' | 'B' | 'C' | 'D' | 'E',
      explanation: explanation || 'Pembahasan belum ditambahkan.',
    });
  });

  return { questions, errors };
}
