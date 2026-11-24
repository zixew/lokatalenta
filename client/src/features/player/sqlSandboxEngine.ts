export interface SqlTableSchema {
  name: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

export interface SqlScenario {
  id: string;
  title: string;
  mission: string;
  tableName: string;
  starterQuery: string;
  solutionQuery: string;
  expectedRowCount: number;
  expectedFirstValue?: string | number;
}

export interface SqlExecutionResult {
  ok: boolean;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  error?: string;
}

export const SQL_SANDBOX_TABLES: Record<string, SqlTableSchema> = {
  karyawan: {
    name: 'karyawan',
    columns: ['id', 'nama', 'divisi', 'gaji', 'skor_tes'],
    rows: [
      { id: 1, nama: 'Budi Santoso', divisi: 'Operasional', gaji: 7500000, skor_tes: 82 },
      { id: 2, nama: 'Sari Dewi', divisi: 'Keuangan', gaji: 9200000, skor_tes: 91 },
      { id: 3, nama: 'Andi Pratama', divisi: 'IT & Data', gaji: 11500000, skor_tes: 95 },
      { id: 4, nama: 'Rina Melati', divisi: 'Keuangan', gaji: 8800000, skor_tes: 86 },
      { id: 5, nama: 'Dimas Putra', divisi: 'IT & Data', gaji: 10500000, skor_tes: 89 },
    ],
  },
};

export const SQL_SCENARIOS: SqlScenario[] = [
  {
    id: 'sql-where',
    title: 'Filter WHERE',
    mission: 'Tampilkan nama dan gaji karyawan dari divisi Keuangan.',
    tableName: 'karyawan',
    starterQuery: "SELECT nama, gaji FROM karyawan",
    solutionQuery: "SELECT nama, gaji FROM karyawan WHERE divisi = 'Keuangan'",
    expectedRowCount: 2,
  },
  {
    id: 'sql-order-limit',
    title: 'ORDER BY & LIMIT',
    mission: 'Ambil 2 karyawan dengan skor_tes tertinggi (urutkan DESC).',
    tableName: 'karyawan',
    starterQuery: 'SELECT nama, skor_tes FROM karyawan',
    solutionQuery: 'SELECT nama, skor_tes FROM karyawan ORDER BY skor_tes DESC LIMIT 2',
    expectedRowCount: 2,
    expectedFirstValue: 'Andi Pratama',
  },
  {
    id: 'sql-count',
    title: 'Agregasi COUNT',
    mission: "Hitung jumlah karyawan pada divisi 'IT & Data' menggunakan COUNT(*).",
    tableName: 'karyawan',
    starterQuery: "SELECT COUNT(*) FROM karyawan",
    solutionQuery: "SELECT COUNT(*) FROM karyawan WHERE divisi = 'IT & Data'",
    expectedRowCount: 1,
    expectedFirstValue: 2,
  },
];

const FORBIDDEN_KEYWORDS = /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|EXEC|UNION|JOIN)\b/i;

function parseLiteral(raw: string): string | number {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  const num = Number(trimmed);
  return Number.isFinite(num) && trimmed !== '' ? num : trimmed;
}

export function executeClientSql(rawQuery: string): SqlExecutionResult {
  const query = rawQuery.trim().replace(/;+$/, '').replace(/\s+/g, ' ');
  if (!query) {
    return { ok: false, columns: [], rows: [], error: 'Query SQL tidak boleh kosong.' };
  }
  if (query.includes(';') || query.includes('--')) {
    return { ok: false, columns: [], rows: [], error: 'Multi-statement atau komentar SQL tidak diizinkan.' };
  }
  if (FORBIDDEN_KEYWORDS.test(query)) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: 'Sandbox hanya mengizinkan query pembacaan SELECT.',
    };
  }

  const match = query.match(
    /^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i
  );

  if (!match) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: 'Sintaks tidak valid. Gunakan pola: SELECT <kolom> FROM <tabel> [WHERE ...] [ORDER BY ... ASC|DESC] [LIMIT N].',
    };
  }

  const [, selectClause, tableNameRaw, whereClause, orderCol, orderDir, limitRaw] = match;
  const tableName = tableNameRaw.toLowerCase();
  if (!Object.hasOwn(SQL_SANDBOX_TABLES, tableName)) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: `Tabel "${tableNameRaw}" tidak ditemukan. Tersedia: ${Object.keys(SQL_SANDBOX_TABLES).join(', ')}.`,
    };
  }

  const table = SQL_SANDBOX_TABLES[tableName];
  let workingRows = table.rows.map((r) => ({ ...r }));

  // WHERE evaluation (supports =, !=, >, <, >=, <=)
  if (whereClause) {
    const wMatch = whereClause.match(
      /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(=|!=|>=|<=|>|<)\s*(.+)$/
    );
    if (!wMatch) {
      return {
        ok: false,
        columns: [],
        rows: [],
        error: 'Klausa WHERE harus berbentuk: kolom = nilai (atau >, <, >=, <=, !=).',
      };
    }
    const [, wCol, op, rawVal] = wMatch;
    if (!table.columns.includes(wCol)) {
      return { ok: false, columns: [], rows: [], error: `Kolom "${wCol}" tidak ada di tabel ${tableName}.` };
    }
    const targetVal = parseLiteral(rawVal);

    workingRows = workingRows.filter((row) => {
      const cell = row[wCol];
      if (op === '=') return cell === targetVal;
      if (op === '!=') return cell !== targetVal;
      if (typeof cell === 'number' && typeof targetVal === 'number') {
        if (op === '>') return cell > targetVal;
        if (op === '<') return cell < targetVal;
        if (op === '>=') return cell >= targetVal;
        if (op === '<=') return cell <= targetVal;
      }
      return false;
    });
  }

  // Aggregate support: COUNT(*), SUM(col), AVG(col)
  const aggMatch = selectClause.trim().match(/^(COUNT|SUM|AVG)\(([^)]+)\)(?:\s+AS\s+([a-zA-Z_][a-zA-Z0-9_]*))?$/i);
  if (aggMatch) {
    const [, fnRaw, argRaw, aliasRaw] = aggMatch;
    const fn = fnRaw.toUpperCase();
    const arg = argRaw.trim();
    const outCol = aliasRaw || `${fn.toLowerCase()}_${arg === '*' ? 'all' : arg}`;

    let aggValue = 0;
    if (fn === 'COUNT') {
      aggValue = workingRows.length;
    } else {
      if (!table.columns.includes(arg)) {
        return { ok: false, columns: [], rows: [], error: `Kolom "${arg}" tidak ditemukan untuk ${fn}.` };
      }
      const nums = workingRows.map((r) => Number(r[arg]) || 0);
      const sum = nums.reduce((a, b) => a + b, 0);
      aggValue = fn === 'SUM' ? sum : nums.length > 0 ? Math.round((sum / nums.length) * 100) / 100 : 0;
    }

    return {
      ok: true,
      columns: [outCol],
      rows: [{ [outCol]: aggValue }],
    };
  }

  // ORDER BY
  if (orderCol) {
    if (!table.columns.includes(orderCol)) {
      return { ok: false, columns: [], rows: [], error: `Kolom ORDER BY "${orderCol}" tidak ditemukan.` };
    }
    const desc = (orderDir || 'ASC').toUpperCase() === 'DESC';
    workingRows.sort((a, b) => {
      const va = a[orderCol];
      const vb = b[orderCol];
      if (va < vb) return desc ? 1 : -1;
      if (va > vb) return desc ? -1 : 1;
      return 0;
    });
  }

  // LIMIT (hard cap 100)
  if (limitRaw) {
    const limit = Math.min(100, Math.max(0, Number(limitRaw)));
    workingRows = workingRows.slice(0, limit);
  }

  // SELECT projection
  const selectedCols =
    selectClause.trim() === '*'
      ? [...table.columns]
      : selectClause.split(',').map((c) => c.trim());

  for (const col of selectedCols) {
    if (!table.columns.includes(col)) {
      return { ok: false, columns: [], rows: [], error: `Kolom "${col}" tidak ditemukan di tabel ${tableName}.` };
    }
  }

  const projected = workingRows.map((r) => {
    const out: Record<string, string | number> = {};
    for (const col of selectedCols) {
      out[col] = r[col];
    }
    return out;
  });

  return { ok: true, columns: selectedCols, rows: projected };
}

export function isSqlMissionPassed(
  result: SqlExecutionResult,
  scenario: SqlScenario
): boolean {
  if (!result.ok || result.rows.length !== scenario.expectedRowCount) {
    return false;
  }
  if (scenario.expectedFirstValue !== undefined) {
    const firstRow = result.rows[0];
    const firstKey = result.columns[0];
    return firstRow?.[firstKey] === scenario.expectedFirstValue;
  }
  return true;
}

export function isTechnicalSqlCourse(courseTitle: string, courseCategory: string): boolean {
  const text = `${courseTitle} ${courseCategory}`.toLowerCase();
  return (
    text.includes('sql') ||
    text.includes('database') ||
    text.includes('query') ||
    text.includes('data analyst')
  );
}
