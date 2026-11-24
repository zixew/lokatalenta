export type SpreadsheetCells = Record<string, string>;

export interface SpreadsheetScenario {
  id: string;
  title: string;
  instruction: string;
  cols: string[];
  rows: number;
  initialCells: SpreadsheetCells;
  targetCell: string;
  expectedValue: string | number;
  sampleFormula: string;
}

export const SPREADSHEET_SCENARIOS: SpreadsheetScenario[] = [
  {
    id: 'sum-average-sales',
    title: 'Rekap Penjualan (SUM & AVERAGE)',
    instruction:
      'Klik sel B6, lalu ketik rumus =SUM(B2:B5) di Formula Bar (fx) untuk menghitung total penjualan.',
    cols: ['A', 'B', 'C', 'D'],
    rows: 7,
    initialCells: {
      A1: 'Cabang',
      B1: 'Omzet (Rp)',
      C1: 'Target',
      D1: 'Status',
      A2: 'Jakarta',
      B2: '8500000',
      C2: '8000000',
      D2: '=IF(B2>=C2,"Tercapai","Belum")',
      A3: 'Bandung',
      B3: '6500000',
      C3: '7000000',
      D3: '=IF(B3>=C3,"Tercapai","Belum")',
      A4: 'Surabaya',
      B4: '9000000',
      C4: '8500000',
      D4: '=IF(B4>=C4,"Tercapai","Belum")',
      A5: 'Semarang',
      B5: '6000000',
      C5: '6000000',
      D5: '=IF(B5>=C5,"Tercapai","Belum")',
      A6: 'TOTAL',
      B6: '',
      A7: 'RATA-RATA',
      B7: '=AVERAGE(B2:B5)',
    },
    targetCell: 'B6',
    expectedValue: 30000000,
    sampleFormula: '=SUM(B2:B5)',
  },
  {
    id: 'if-commission-tier',
    title: 'Komisi Bertingkat (IF)',
    instruction:
      'Klik sel C2, lalu ketik rumus =IF(B2>=10000000,"Bonus 10%","Bonus 5%") untuk menentukan tier bonus.',
    cols: ['A', 'B', 'C'],
    rows: 4,
    initialCells: {
      A1: 'Nama Sales',
      B1: 'Penjualan',
      C1: 'Tier Bonus',
      A2: 'Rizco',
      B2: '12500000',
      C2: '',
      A3: 'Eka',
      B3: '8500000',
      C3: '=IF(B3>=10000000,"Bonus 10%","Bonus 5%")',
      A4: 'Budi',
      B4: '10000000',
      C4: '=IF(B4>=10000000,"Bonus 10%","Bonus 5%")',
    },
    targetCell: 'C2',
    expectedValue: 'Bonus 10%',
    sampleFormula: '=IF(B2>=10000000,"Bonus 10%","Bonus 5%")',
  },
  {
    id: 'vlookup-product-price',
    title: 'Lookup Data Barang (VLOOKUP)',
    instruction:
      'Klik sel E2, lalu ketik rumus =VLOOKUP("A02",A2:C4,3,FALSE) untuk mengambil harga produk kode A02.',
    cols: ['A', 'B', 'C', 'D', 'E'],
    rows: 4,
    initialCells: {
      A1: 'Kode',
      B1: 'Produk',
      C1: 'Harga',
      D1: 'Cari Kode',
      E1: 'Hasil Harga',
      A2: 'A01',
      B2: 'Keyboard',
      C2: '250000',
      D2: 'A02',
      E2: '',
      A3: 'A02',
      B3: 'Mouse Wireless',
      C3: '125000',
      A4: 'A03',
      B4: 'Headset',
      C4: '320000',
    },
    targetCell: 'E2',
    expectedValue: 125000,
    sampleFormula: '=VLOOKUP("A02",A2:C4,3,FALSE)',
  },
];

export function isTechnicalSpreadsheetCourse(title: string, category: string): boolean {
  const text = `${title} ${category}`.toLowerCase();
  return (
    text.includes('excel') ||
    text.includes('spreadsheet') ||
    text.includes('komisi') ||
    text.includes('akuntansi') ||
    text.includes('penjualan') ||
    text.includes('administrasi') ||
    text.includes('kasir') ||
    text.includes('rekonsiliasi') ||
    text.includes('rumus')
  );
}

function colLettersToIndex(letters: string): number {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function indexToColLetters(idx: number): string {
  let n = idx + 1;
  let str = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

function parseCellRef(ref: string): { col: number; row: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(ref.trim().toUpperCase());
  if (!m) return null;
  return { col: colLettersToIndex(m[1]), row: Number(m[2]) };
}

function expandRange(startRef: string, endRef: string): string[] {
  const s = parseCellRef(startRef);
  const e = parseCellRef(endRef);
  if (!s || !e) return [];
  const c1 = Math.min(s.col, e.col);
  const c2 = Math.max(s.col, e.col);
  const r1 = Math.min(s.row, e.row);
  const r2 = Math.max(s.row, e.row);
  const refs: string[] = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      refs.push(`${indexToColLetters(c)}${r}`);
    }
  }
  return refs;
}

function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (!inQuotes && ch === '(') {
      depth++;
      current += ch;
    } else if (!inQuotes && ch === ')') {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (!inQuotes && depth === 0 && ch === ',') {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '') args.push(current.trim());
  return args;
}

function toNumber(val: string | number): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const n = Number(String(val).trim());
  return Number.isFinite(n) ? n : 0;
}

function evaluateSafeArithmetic(expr: string): number | null {
  const clean = expr.replace(/\s+/g, '');
  if (!/^[0-9+\-*/().]+$/.test(clean)) return null;

  let pos = 0;
  const parseExpr = (): number => {
    let val = parseTerm();
    while (pos < clean.length && (clean[pos] === '+' || clean[pos] === '-')) {
      const op = clean[pos++];
      const rhs = parseTerm();
      val = op === '+' ? val + rhs : val - rhs;
    }
    return val;
  };
  const parseTerm = (): number => {
    let val = parseFactor();
    while (pos < clean.length && (clean[pos] === '*' || clean[pos] === '/')) {
      const op = clean[pos++];
      const rhs = parseFactor();
      val = op === '*' ? val * rhs : rhs === 0 ? NaN : val / rhs;
    }
    return val;
  };
  const parseFactor = (): number => {
    if (clean[pos] === '(') {
      pos++;
      const val = parseExpr();
      if (clean[pos] === ')') pos++;
      return val;
    }
    if (clean[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    const start = pos;
    while (pos < clean.length && /[0-9.]/.test(clean[pos])) pos++;
    if (start === pos) return NaN;
    return Number(clean.slice(start, pos));
  };

  const result = parseExpr();
  if (pos !== clean.length || !Number.isFinite(result)) return null;
  return result;
}

export function evaluateCell(
  cellId: string,
  cells: SpreadsheetCells,
  visited: Set<string> = new Set()
): string | number {
  const key = cellId.toUpperCase();
  if (visited.has(key)) return '#REF!';

  const raw = (cells[key] ?? '').trim();
  if (!raw) return '';
  if (!raw.startsWith('=')) {
    const num = Number(raw);
    return raw !== '' && Number.isFinite(num) ? num : raw;
  }

  const nextVisited = new Set(visited);
  nextVisited.add(key);

  const formula = raw.slice(1).trim();
  return evaluateFormulaExpr(formula, cells, nextVisited);
}

function evaluateFormulaExpr(
  expr: string,
  cells: SpreadsheetCells,
  visited: Set<string>
): string | number {
  const trimmed = expr.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }

  const fnMatch = /^([A-Z]+)\((.*)\)$/i.exec(trimmed);
  if (fnMatch) {
    const fnName = fnMatch[1].toUpperCase();
    const args = splitArgs(fnMatch[2]);

    const collectNumbers = (): number[] => {
      const nums: number[] = [];
      for (const arg of args) {
        const rangeMatch = /^([A-Z]+\d+):([A-Z]+\d+)$/i.exec(arg);
        if (rangeMatch) {
          for (const ref of expandRange(rangeMatch[1], rangeMatch[2])) {
            const v = evaluateCell(ref, cells, visited);
            if (v !== '' && !Number.isNaN(Number(v))) nums.push(Number(v));
          }
        } else if (/^[A-Z]+\d+$/i.test(arg)) {
          const v = evaluateCell(arg, cells, visited);
          if (v !== '' && !Number.isNaN(Number(v))) nums.push(Number(v));
        } else {
          const v = evaluateFormulaExpr(arg, cells, visited);
          if (v !== '' && !Number.isNaN(Number(v))) nums.push(Number(v));
        }
      }
      return nums;
    };

    if (fnName === 'SUM') {
      return collectNumbers().reduce((a, b) => a + b, 0);
    }
    if (fnName === 'AVERAGE') {
      const nums = collectNumbers();
      return nums.length > 0
        ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
        : 0;
    }
    if (fnName === 'MIN') {
      const nums = collectNumbers();
      return nums.length > 0 ? Math.min(...nums) : 0;
    }
    if (fnName === 'MAX') {
      const nums = collectNumbers();
      return nums.length > 0 ? Math.max(...nums) : 0;
    }
    if (fnName === 'COUNT') {
      return collectNumbers().length;
    }
    if (fnName === 'IF' && args.length >= 3) {
      const condMatch = /^(.+?)(>=|<=|<>|=|>|<)(.+)$/.exec(args[0]);
      if (!condMatch) return '#ERROR!';
      const left = evaluateFormulaExpr(condMatch[1], cells, visited);
      const op = condMatch[2];
      const right = evaluateFormulaExpr(condMatch[3], cells, visited);
      const lNum = Number(left);
      const rNum = Number(right);
      const numericCompare =
        left !== '' && right !== '' && Number.isFinite(lNum) && Number.isFinite(rNum);

      let passed = false;
      if (op === '>=') passed = numericCompare ? lNum >= rNum : String(left) >= String(right);
      else if (op === '<=') passed = numericCompare ? lNum <= rNum : String(left) <= String(right);
      else if (op === '>') passed = numericCompare ? lNum > rNum : String(left) > String(right);
      else if (op === '<') passed = numericCompare ? lNum < rNum : String(left) < String(right);
      else if (op === '=') passed = numericCompare ? lNum === rNum : String(left) === String(right);
      else if (op === '<>') passed = numericCompare ? lNum !== rNum : String(left) !== String(right);

      return evaluateFormulaExpr(passed ? args[1] : args[2], cells, visited);
    }
    if (fnName === 'VLOOKUP' && args.length >= 3) {
      const lookupVal = String(evaluateFormulaExpr(args[0], cells, visited)).trim();
      const rangeMatch = /^([A-Z]+\d+):([A-Z]+\d+)$/i.exec(args[1]);
      const colOffset = Math.max(1, Math.floor(toNumber(evaluateFormulaExpr(args[2], cells, visited))));
      if (!rangeMatch) return '#ERROR!';
      const s = parseCellRef(rangeMatch[1]);
      const e = parseCellRef(rangeMatch[2]);
      if (!s || !e) return '#ERROR!';
      const startCol = Math.min(s.col, e.col);
      const r1 = Math.min(s.row, e.row);
      const r2 = Math.max(s.row, e.row);
      for (let r = r1; r <= r2; r++) {
        const keyCell = `${indexToColLetters(startCol)}${r}`;
        const keyVal = String(evaluateCell(keyCell, cells, visited)).trim();
        if (keyVal.toLowerCase() === lookupVal.toLowerCase()) {
          const targetCol = startCol + colOffset - 1;
          if (targetCol > Math.max(s.col, e.col)) return '#REF!';
          return evaluateCell(`${indexToColLetters(targetCol)}${r}`, cells, visited);
        }
      }
      return '#N/A';
    }
  }

  if (/^[A-Z]+\d+$/i.test(trimmed)) {
    return evaluateCell(trimmed, cells, visited);
  }

  // Replace cell references inside arithmetic expression
  const replaced = trimmed.replace(/\b([A-Z]+\d+)\b/gi, (ref) => {
    const val = evaluateCell(ref, cells, visited);
    return String(toNumber(val));
  });

  const arith = evaluateSafeArithmetic(replaced);
  if (arith !== null) return Math.round(arith * 100) / 100;

  const num = Number(trimmed);
  if (trimmed !== '' && Number.isFinite(num)) return num;
  return '#ERROR!';
}
