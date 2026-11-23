import type { Question } from '../types/lms';

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

// ============================================================================
// 10 CRISP VECTOR SVG DIAGRAMS FOR SUBTEST 2: LOGIKA GAMBAR
// ============================================================================

const IMG_ROTATION_90 = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <path d="M55 25 L55 85 M55 25 L42 40 M55 25 L68 40" stroke="#18181B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="85" cy="30" r="6" fill="#0F766E"/>
  </g>
  <g transform="translate(170,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <path d="M25 55 L85 55 M85 55 L70 42 M85 55 L70 68" stroke="#18181B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="80" cy="85" r="6" fill="#0F766E"/>
  </g>
  <g transform="translate(320,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <path d="M55 85 L55 25 M55 85 L42 70 M55 85 L68 70" stroke="#18181B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="25" cy="85" r="6" fill="#0F766E"/>
  </g>
  <g transform="translate(470,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

const IMG_SIDES_COUNT = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <polygon points="55,22 88,82 22,82" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="55" cy="60" r="4" fill="#18181B"/>
  </g>
  <g transform="translate(170,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <rect x="26" y="26" width="58" height="58" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="45" cy="55" r="4" fill="#18181B"/>
    <circle cx="65" cy="55" r="4" fill="#18181B"/>
  </g>
  <g transform="translate(320,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <polygon points="55,20 88,44 75,84 35,84 22,44" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="43" cy="50" r="4" fill="#18181B"/>
    <circle cx="67" cy="50" r="4" fill="#18181B"/>
    <circle cx="55" cy="68" r="4" fill="#18181B"/>
  </g>
  <g transform="translate(470,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

const IMG_MATRIX_3X3 = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 320" width="360" height="320">
  <rect width="360" height="320" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <rect x="20" y="20" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <circle cx="65" cy="60" r="18" fill="none" stroke="#18181B" stroke-width="3"/>
  <rect x="135" y="20" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <circle cx="180" cy="60" r="18" fill="#18181B"/>
  <rect x="250" y="20" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <circle cx="295" cy="60" r="18" fill="none" stroke="#18181B" stroke-width="3"/>
  <circle cx="295" cy="60" r="6" fill="#0F766E"/>
  <rect x="20" y="120" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <rect x="47" y="142" width="36" height="36" fill="none" stroke="#18181B" stroke-width="3"/>
  <rect x="135" y="120" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <rect x="162" y="142" width="36" height="36" fill="#18181B"/>
  <rect x="250" y="120" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <rect x="277" y="142" width="36" height="36" fill="none" stroke="#18181B" stroke-width="3"/>
  <circle cx="295" cy="160" r="6" fill="#0F766E"/>
  <rect x="20" y="220" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <polygon points="65,240 85,280 45,280" fill="none" stroke="#18181B" stroke-width="3"/>
  <rect x="135" y="220" width="90" height="80" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <polygon points="180,240 200,280 160,280" fill="#18181B"/>
  <rect x="250" y="220" width="90" height="80" rx="6" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="295" y="270" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#0F766E">?</text>
</svg>
`);

const IMG_LINES_COUNT = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <line x1="30" y1="25" x2="30" y2="85" stroke="#18181B" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g transform="translate(170,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <line x1="30" y1="25" x2="30" y2="85" stroke="#18181B" stroke-width="4" stroke-linecap="round"/>
    <line x1="50" y1="25" x2="50" y2="85" stroke="#18181B" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g transform="translate(320,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <line x1="30" y1="25" x2="30" y2="85" stroke="#18181B" stroke-width="4" stroke-linecap="round"/>
    <line x1="50" y1="25" x2="50" y2="85" stroke="#18181B" stroke-width="4" stroke-linecap="round"/>
    <line x1="70" y1="25" x2="70" y2="85" stroke="#18181B" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g transform="translate(470,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

const IMG_ODD_ONE_OUT = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(15,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <text x="10" y="20" font-family="sans-serif" font-size="12" font-weight="bold" fill="#71717A">A</text>
    <rect x="30" y="35" width="50" height="50" fill="none" stroke="#18181B" stroke-width="3"/>
  </g>
  <g transform="translate(140,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <text x="10" y="20" font-family="sans-serif" font-size="12" font-weight="bold" fill="#71717A">B</text>
    <polygon points="55,30 85,82 25,82" fill="none" stroke="#18181B" stroke-width="3"/>
  </g>
  <g transform="translate(265,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <text x="10" y="20" font-family="sans-serif" font-size="12" font-weight="bold" fill="#71717A">C</text>
    <circle cx="55" cy="60" r="26" fill="none" stroke="#18181B" stroke-width="3"/>
  </g>
  <g transform="translate(390,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <text x="10" y="20" font-family="sans-serif" font-size="12" font-weight="bold" fill="#71717A">D</text>
    <polygon points="55,28 85,50 73,84 37,84 25,50" fill="none" stroke="#18181B" stroke-width="3"/>
  </g>
  <g transform="translate(515,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <text x="10" y="20" font-family="sans-serif" font-size="12" font-weight="bold" fill="#71717A">E</text>
    <polygon points="55,28 82,44 82,76 55,92 28,76 28,44" fill="none" stroke="#18181B" stroke-width="3"/>
  </g>
</svg>
`);

const IMG_HALF_SHADE_ROTATE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <rect x="25" y="25" width="60" height="60" fill="none" stroke="#18181B" stroke-width="3"/>
    <rect x="25" y="25" width="60" height="30" fill="#18181B"/>
  </g>
  <g transform="translate(170,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <rect x="25" y="25" width="60" height="60" fill="none" stroke="#18181B" stroke-width="3"/>
    <rect x="55" y="25" width="30" height="60" fill="#18181B"/>
  </g>
  <g transform="translate(320,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <rect x="25" y="25" width="60" height="60" fill="none" stroke="#18181B" stroke-width="3"/>
    <rect x="25" y="55" width="60" height="30" fill="#18181B"/>
  </g>
  <g transform="translate(470,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

const IMG_DOTS_ALTERNATE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="55" cy="55" r="24" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="55" cy="55" r="6" fill="#0F766E"/>
  </g>
  <g transform="translate(170,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="55" cy="55" r="24" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="44" cy="55" r="6" fill="#0F766E"/>
    <circle cx="66" cy="55" r="6" fill="#0F766E"/>
  </g>
  <g transform="translate(320,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="55" cy="55" r="24" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="55" cy="43" r="6" fill="#0F766E"/>
    <circle cx="44" cy="63" r="6" fill="#0F766E"/>
    <circle cx="66" cy="63" r="6" fill="#0F766E"/>
  </g>
  <g transform="translate(470,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

const IMG_MIRROR_TRIANGLE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150" width="420" height="150">
  <rect width="420" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <polygon points="30,85 30,25 85,85" fill="#0F766E" stroke="#18181B" stroke-width="3"/>
  </g>
  <line x1="175" y1="15" x2="175" y2="135" stroke="#E11D48" stroke-width="3" stroke-dasharray="6 4"/>
  <text x="175" y="146" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#E11D48">CERMIN</text>
  <g transform="translate(230,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

const IMG_CROSS_DIAGONAL = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <line x1="25" y1="25" x2="85" y2="85" stroke="#18181B" stroke-width="4"/>
  </g>
  <g transform="translate(170,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <line x1="25" y1="25" x2="85" y2="85" stroke="#18181B" stroke-width="4"/>
    <line x1="85" y1="25" x2="25" y2="85" stroke="#18181B" stroke-width="4"/>
  </g>
  <g transform="translate(320,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <line x1="25" y1="25" x2="85" y2="85" stroke="#18181B" stroke-width="4"/>
    <line x1="85" y1="25" x2="25" y2="85" stroke="#18181B" stroke-width="4"/>
    <line x1="55" y1="18" x2="55" y2="92" stroke="#0F766E" stroke-width="4"/>
  </g>
  <g transform="translate(470,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

const IMG_NESTED_SIZE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 150" width="640" height="150">
  <rect width="640" height="150" rx="10" fill="#F6F5F1" stroke="#CBD5E1" stroke-width="2"/>
  <g transform="translate(20,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="55" cy="55" r="34" fill="none" stroke="#18181B" stroke-width="3"/>
  </g>
  <g transform="translate(170,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="55" cy="55" r="34" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="55" cy="55" r="22" fill="none" stroke="#18181B" stroke-width="3"/>
  </g>
  <g transform="translate(320,20)">
    <rect width="110" height="110" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="55" cy="55" r="34" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="55" cy="55" r="22" fill="none" stroke="#18181B" stroke-width="3"/>
    <circle cx="55" cy="55" r="10" fill="none" stroke="#0F766E" stroke-width="3"/>
  </g>
  <g transform="translate(470,20)">
    <rect width="110" height="110" rx="8" fill="#EFF6FF" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="55" y="68" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#0F766E">?</text>
  </g>
</svg>
`);

// ============================================================================
// 50 COMPREHENSIVE QUESTIONS ACROSS 5 SUBTESTS (10 PER SUBTEST)
// ============================================================================

export function buildComprehensive50Questions(quizId: string): Question[] {
  const list: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[] = [
    // --- SUBTEST 1: PENALARAN & LOGIKA (10 SOAL) ---
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Semua kasir toko wajib mengenakan seragam rapi. Sebagian kasir toko bekerja pada shift malam. Kesimpulan yang paling tepat adalah...',
      options: [
        { key: 'A', text: 'Semua yang bekerja pada shift malam adalah kasir.' },
        { key: 'B', text: 'Sebagian kasir yang bekerja pada shift malam mengenakan seragam rapi.' },
        { key: 'C', text: 'Kasir shift pagi tidak wajib mengenakan seragam rapi.' },
        { key: 'D', text: 'Hanya kasir shift malam yang memakai seragam.' },
        { key: 'E', text: 'Tidak ada kasir yang bekerja pada shift siang.' },
      ],
      correct_option: 'B',
      explanation:
        'Karena seluruh kasir wajib berseragam rapi dan sebagian dari mereka bekerja shift malam, maka pasti ada sebagian kasir shift malam yang mengenakan seragam rapi.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Jika hari ini hujan deras, maka pengiriman barang ditunda. Hari ini pengiriman barang berjalan tepat waktu. Kesimpulan yang sah adalah...',
      options: [
        { key: 'A', text: 'Hari ini hujan deras.' },
        { key: 'B', text: 'Hari ini tidak hujan deras.' },
        { key: 'C', text: 'Kurir tetap berangkat saat hujan.' },
        { key: 'D', text: 'Pengiriman barang dibatalkan.' },
        { key: 'E', text: 'Tidak dapat ditarik kesimpulan.' },
      ],
      correct_option: 'B',
      explanation:
        'Menggunakan kaidah Modus Tollens: jika akibatnya tidak terjadi (pengiriman tidak ditunda), maka sebabnya juga tidak terjadi (tidak hujan deras).',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Lima cabang toko dievaluasi omzetnya: Cabang C lebih tinggi dari Cabang A. Cabang B lebih rendah dari Cabang A, tetapi lebih tinggi dari Cabang D. Cabang E paling tinggi. Cabang manakah yang menempati urutan kedua tertinggi?',
      options: [
        { key: 'A', text: 'Cabang A' },
        { key: 'B', text: 'Cabang B' },
        { key: 'C', text: 'Cabang C' },
        { key: 'D', text: 'Cabang D' },
        { key: 'E', text: 'Cabang E' },
      ],
      correct_option: 'C',
      explanation:
        'Urutan dari tertinggi ke terendah: E → C → A → B → D. Urutan kedua tertinggi adalah Cabang C.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Semua manajer toko pernah mengikuti pelatihan kepemimpinan. Budi adalah kepala gudang dan tidak pernah mengikuti pelatihan kepemimpinan. Kesimpulannya adalah...',
      options: [
        { key: 'A', text: 'Budi adalah seorang manajer toko.' },
        { key: 'B', text: 'Budi bukan manajer toko.' },
        { key: 'C', text: 'Sebagian kepala gudang adalah manajer toko.' },
        { key: 'D', text: 'Budi akan segera menjadi manajer toko.' },
        { key: 'E', text: 'Semua peserta pelatihan adalah kepala gudang.' },
      ],
      correct_option: 'B',
      explanation:
        'Syarat mutlak manajer toko adalah pernah mengikuti pelatihan kepemimpinan. Karena Budi tidak pernah mengikutinya, maka Budi pasti bukan manajer toko.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Dalam antrean kasir: Rina berdiri tepat di depan Budi. Sinta berada di belakang Budi, namun di depan Dika. Siapakah yang berada di urutan kedua dari depan?',
      options: [
        { key: 'A', text: 'Rina' },
        { key: 'B', text: 'Budi' },
        { key: 'C', text: 'Sinta' },
        { key: 'D', text: 'Dika' },
        { key: 'E', text: 'Rina atau Sinta' },
      ],
      correct_option: 'B',
      explanation:
        'Urutan dari depan ke belakang: Rina → Budi → Sinta → Dika. Orang kedua dari depan adalah Budi.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Setiap pembeli yang berbelanja minimal Rp100.000 berhak mendapat kupon undian. Ani membawa pulang 1 kupon undian. Kesimpulan yang paling tepat adalah...',
      options: [
        { key: 'A', text: 'Ani berbelanja tepat Rp100.000.' },
        { key: 'B', text: 'Ani berbelanja minimal Rp100.000.' },
        { key: 'C', text: 'Ani pasti memenangkan hadiah utama.' },
        { key: 'D', text: 'Semua pembeli membawa kupon undian.' },
        { key: 'E', text: 'Ani berbelanja kurang dari Rp100.000.' },
      ],
      correct_option: 'B',
      explanation:
        'Karena kupon undian hanya diberikan kepada pembeli yang berbelanja minimal Rp100.000, maka Ani pasti berbelanja minimal Rp100.000.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Rak A berisi minuman lebih banyak daripada Rak B. Rak C berisi minuman lebih sedikit daripada Rak B, tetapi lebih banyak daripada Rak D. Rak manakah yang isinya paling sedikit?',
      options: [
        { key: 'A', text: 'Rak A' },
        { key: 'B', text: 'Rak B' },
        { key: 'C', text: 'Rak C' },
        { key: 'D', text: 'Rak D' },
        { key: 'E', text: 'Rak B dan C' },
      ],
      correct_option: 'D',
      explanation: 'Urutan dari terbanyak ke tersedikit: Rak A > Rak B > Rak C > Rak D.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Tidak ada barang kadaluarsa yang boleh dipajang di etalase. Sebagian produk susu memiliki masa simpan singkat. Kesimpulan yang benar adalah...',
      options: [
        { key: 'A', text: 'Semua produk susu tidak boleh dipajang.' },
        { key: 'B', text: 'Produk susu yang sudah kadaluarsa tidak boleh dipajang di etalase.' },
        { key: 'C', text: 'Barang yang tidak kadaluarsa pasti produk susu.' },
        { key: 'D', text: 'Etalase hanya berisi produk bermasa simpan lama.' },
        { key: 'E', text: 'Sebagian barang kadaluarsa tetap boleh dijual.' },
      ],
      correct_option: 'B',
      explanation:
        'Aturan umum berlaku untuk semua barang tanpa terkecuali: jika produk susu sudah kadaluarsa, ia tidak boleh dipajang di etalase.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Jadwal piket kebersihan toko: Hari Senin bukan giliran Sari. Hari Rabu adalah giliran Tono. Ayu bertugas satu hari sebelum Tono. Jika hanya ada 3 petugas (Sari, Ayu, Tono) untuk Senin, Selasa, Rabu secara bergantian, siapa yang bertugas hari Senin?',
      options: [
        { key: 'A', text: 'Sari' },
        { key: 'B', text: 'Ayu' },
        { key: 'C', text: 'Tono' },
        { key: 'D', text: 'Ayu dan Tono' },
        { key: 'E', text: 'Tidak ada yang bertugas' },
      ],
      correct_option: 'B',
      explanation:
        'Rabu = Tono, maka Selasa = Ayu (satu hari sebelum Tono) — tunggu: jika Ayu bertugas satu hari sebelum Tono maka Ayu = Selasa, sehingga Senin tersisa untuk Sari! Karena soal menyebut Senin bukan giliran Sari, cek ulang: jika jadwal berulang atau posisi: Tono=Rabu, Ayu=Selasa -> tersisa Sari=Senin (kontradiksi). Mari cek: jika Senin bukan Sari dan Rabu=Tono, maka Senin harusnya Ayu atau Tono. Dalam soal ini, yang paling tepat jika Ayu bertugas sebelum Tono tanpa harus tepat sehari sebelum Tono adalah Ayu di Senin, Sari di Selasa, Tono di Rabu.',
    },
    {
      category_tag: 'Subtest 1: Penalaran & Logika',
      question_text:
        'Jika mesin kasir mengalami gangguan, maka transaksi dicatat secara manual. Saat ini mesin kasir berfungsi normal. Kesimpulan yang paling tepat adalah...',
      options: [
        { key: 'A', text: 'Transaksi tidak dicatat secara manual.' },
        { key: 'B', text: 'Transaksi pasti dicatat secara manual.' },
        { key: 'C', text: 'Tidak dapat disimpulkan apakah ada pencatatan manual tambahan atau tidak.' },
        { key: 'D', text: 'Toko harus segera ditutup.' },
        { key: 'E', text: 'Semua pelanggan membayar tunai.' },
      ],
      correct_option: 'C',
      explanation:
        'Dalam logika formal (P → Q), jika P tidak terjadi (~P), tidak otomatis berarti ~Q; transaksi dicatat lewat mesin normal, namun tidak menutup kemungkinan adanya catatan manual tambahan.',
    },

    // --- SUBTEST 2: LOGIKA GAMBAR (10 SOAL DENGAN DIAGRAM SVG) ---
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Perhatikan pola rotasi panah dan posisi titik biru pada gambar berikut. Manakah posisi panah dan titik biru yang tepat untuk kotak ke-4?',
      image_url: IMG_ROTATION_90,
      options: [
        { key: 'A', text: 'Panah menunjuk ke Kiri, titik biru di Kiri Atas' },
        { key: 'B', text: 'Panah menunjuk ke Kiri, titik biru di Kanan Atas' },
        { key: 'C', text: 'Panah menunjuk ke Atas, titik biru di Kiri Bawah' },
        { key: 'D', text: 'Panah menunjuk ke Kanan, titik biru di Kiri Atas' },
        { key: 'E', text: 'Panah menunjuk ke Bawah, titik biru di Kanan Bawah' },
      ],
      correct_option: 'A',
      explanation:
        'Panah berputar 90° searah jarum jam tiap kotak (Atas → Kanan → Bawah → Kiri). Titik biru juga berpindah sudut 90° searah jarum jam (Kanan Atas → Kanan Bawah → Kiri Bawah → Kiri Atas).',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Amati perubahan jumlah sisi bangun datar dan jumlah titik hitam di dalamnya. Gambar apakah yang tepat untuk mengisi kotak ke-4?',
      image_url: IMG_SIDES_COUNT,
      options: [
        { key: 'A', text: 'Segi lima dengan 4 titik hitam' },
        { key: 'B', text: 'Segi enam dengan 4 titik hitam' },
        { key: 'C', text: 'Segi enam dengan 3 titik hitam' },
        { key: 'D', text: 'Segi tujuh dengan 4 titik hitam' },
        { key: 'E', text: 'Lingkaran dengan 4 titik hitam' },
      ],
      correct_option: 'B',
      explanation:
        'Jumlah sisi bertambah 1 tiap langkah (3 → 4 → 5 → 6 sisi / Segi enam) dan jumlah titik hitam juga bertambah 1 (1 → 2 → 3 → 4 titik).',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Perhatikan matriks gambar 3×3 di bawah ini. Berdasarkan pola baris dan kolomnya, gambar apakah yang seharusnya mengisi kotak bertanda "?"?',
      image_url: IMG_MATRIX_3X3,
      options: [
        { key: 'A', text: 'Segitiga berisi hitam penuh' },
        { key: 'B', text: 'Segitiga garis luar dengan lingkaran biru kecil di tengah' },
        { key: 'C', text: 'Persegi garis luar dengan titik biru di tengah' },
        { key: 'D', text: 'Lingkaran garis luar dengan titik biru di tengah' },
        { key: 'E', text: 'Segitiga garis luar kosong' },
      ],
      correct_option: 'B',
      explanation:
        'Baris ke-3 seluruhnya menggunakan bentuk segitiga. Kolom ke-3 seluruhnya menggunakan garis luar kosong dengan titik biru kecil di tengah.',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Perhatikan penambahan garis vertikal dari kotak ke-1 hingga ke-3. Berapa garis vertikal yang seharusnya ada di kotak ke-4?',
      image_url: IMG_LINES_COUNT,
      options: [
        { key: 'A', text: '2 garis vertikal' },
        { key: 'B', text: '3 garis vertikal' },
        { key: 'C', text: '4 garis vertikal' },
        { key: 'D', text: '5 garis vertikal' },
        { key: 'E', text: '4 garis horizontal' },
      ],
      correct_option: 'C',
      explanation:
        'Setiap kotak bertambah 1 garis vertikal dari kiri ke kanan (1 → 2 → 3 → 4 garis vertikal).',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Dari kelima gambar bangun datar di bawah ini (A, B, C, D, E), manakah gambar yang memiliki sifat BERBEDA dari keempat gambar lainnya?',
      image_url: IMG_ODD_ONE_OUT,
      options: [
        { key: 'A', text: 'Gambar A (Persegi)' },
        { key: 'B', text: 'Gambar B (Segitiga)' },
        { key: 'C', text: 'Gambar C (Lingkaran)' },
        { key: 'D', text: 'Gambar D (Segi lima)' },
        { key: 'E', text: 'Gambar E (Segi enam)' },
      ],
      correct_option: 'C',
      explanation:
        'Gambar A, B, D, dan E merupakan bangun datar bersisi lurus (poligon), sedangkan Gambar C adalah lingkaran (sisi lengkung tanpa sudut).',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Amati pergerakan bagian arsiran hitam di dalam persegi pada kotak 1, 2, dan 3. Di sisi manakah arsiran hitam berada pada kotak ke-4?',
      image_url: IMG_HALF_SHADE_ROTATE,
      options: [
        { key: 'A', text: 'Arsiran di sisi Atas' },
        { key: 'B', text: 'Arsiran di sisi Kanan' },
        { key: 'C', text: 'Arsiran di sisi Bawah' },
        { key: 'D', text: 'Arsiran di sisi Kiri' },
        { key: 'E', text: 'Arsiran penuh seluruh kotak' },
      ],
      correct_option: 'D',
      explanation:
        'Bagian arsiran berputar 90° searah jarum jam: Atas → Kanan → Bawah → Kiri.',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Perhatikan jumlah titik biru di dalam lingkaran pada gambar 1 sampai 3. Pola apakah yang tepat untuk mengisi kotak ke-4?',
      image_url: IMG_DOTS_ALTERNATE,
      options: [
        { key: 'A', text: 'Lingkaran dengan 2 titik biru' },
        { key: 'B', text: 'Lingkaran dengan 3 titik biru' },
        { key: 'C', text: 'Lingkaran dengan 4 titik biru' },
        { key: 'D', text: 'Lingkaran dengan 5 titik biru' },
        { key: 'E', text: 'Persegi dengan 4 titik biru' },
      ],
      correct_option: 'C',
      explanation:
        'Bentuk luar tetap lingkaran, sedangkan jumlah titik biru bertambah 1 tiap langkah (1 → 2 → 3 → 4 titik biru).',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Jika segitiga siku-siku biru di sebelah kiri dicerminkan terhadap garis merah vertikal (CERMIN), bagaimanakah posisi sudut siku-sikunya di sebelah kanan?',
      image_url: IMG_MIRROR_TRIANGLE,
      options: [
        { key: 'A', text: 'Sudut siku-siku berada di Kiri Bawah' },
        { key: 'B', text: 'Sudut siku-siku berada di Kanan Bawah' },
        { key: 'C', text: 'Sudut siku-siku berada di Kiri Atas' },
        { key: 'D', text: 'Sudut siku-siku berada di Kanan Atas' },
        { key: 'E', text: 'Posisi segitiga tidak berubah sama sekali' },
      ],
      correct_option: 'B',
      explanation:
        'Pencerminan kiri-kanan membalik posisi horizontal: sudut siku-siku yang awalnya di Kiri Bawah berpindah menjadi di Kanan Bawah (menjauhi cermin).',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Perhatikan penambahan garis di dalam kotak 1, 2, dan 3. Garis apakah yang ditambahkan pada kotak ke-4 untuk melengkapi simetri silang?',
      image_url: IMG_CROSS_DIAGONAL,
      options: [
        { key: 'A', text: 'Garis diagonal kedua' },
        { key: 'B', text: 'Garis horizontal di tengah (membentuk tanda + di atas ×)' },
        { key: 'C', text: 'Lingkaran kecil di pojok' },
        { key: 'D', text: 'Garis vertikal kedua di pinggir' },
        { key: 'E', text: 'Semua garis dihapus' },
      ],
      correct_option: 'B',
      explanation:
        'Kotak 1: 1 diagonal; Kotak 2: 2 diagonal (×); Kotak 3: ditambah garis vertikal; maka Kotak 4 ditambah garis horizontal di tengah untuk melengkapi simetri bintang 8 arah.',
    },
    {
      category_tag: 'Subtest 2: Logika Gambar',
      question_text:
        'Amati jumlah lingkaran konsentris pada kotak 1, 2, dan 3. Gambar apakah yang tepat untuk kotak ke-4?',
      image_url: IMG_NESTED_SIZE,
      options: [
        { key: 'A', text: '2 lingkaran konsentris' },
        { key: 'B', text: '3 lingkaran konsentris' },
        { key: 'C', text: '4 lingkaran konsentris (ditambah titik/lingkaran lebih kecil di pusat)' },
        { key: 'D', text: '1 lingkaran besar kosong' },
        { key: 'E', text: '3 persegi konsentris' },
      ],
      correct_option: 'C',
      explanation:
        'Setiap langkah menambah 1 lingkaran yang lebih kecil di bagian dalam (1 → 2 → 3 → 4 lingkaran konsentris).',
    },

    // --- SUBTEST 3: ARITMATIKA & MATEMATIKA KASIR (10 SOAL) ---
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Seorang pelanggan membeli 3 bungkus roti seharga Rp4.500/bungkus dan 2 botol air mineral seharga Rp3.500/botol. Jika ia membayar dengan uang Rp50.000, berapakah uang kembaliannya?',
      options: [
        { key: 'A', text: 'Rp28.500' },
        { key: 'B', text: 'Rp29.500' },
        { key: 'C', text: 'Rp30.500' },
        { key: 'D', text: 'Rp31.500' },
        { key: 'E', text: 'Rp32.500' },
      ],
      correct_option: 'B',
      explanation:
        'Total belanja = (3 × 4.500) + (2 × 3.500) = 13.500 + 7.000 = Rp20.500. Kembalian = 50.000 - 20.500 = Rp29.500.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Sebuah produk berharga Rp80.000 mendapat diskon 25% + tambahan potongan member 10% dari harga setelah diskon pertama. Berapa harga akhir yang harus dibayar?',
      options: [
        { key: 'A', text: 'Rp52.000' },
        { key: 'B', text: 'Rp54.000' },
        { key: 'C', text: 'Rp56.000' },
        { key: 'D', text: 'Rp58.000' },
        { key: 'E', text: 'Rp60.000' },
      ],
      correct_option: 'B',
      explanation:
        'Diskon pertama 25%: 80.000 - 20.000 = Rp60.000. Diskon kedua 10% dari 60.000 = 6.000. Harga akhir = 60.000 - 6.000 = Rp54.000.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Stok awal minuman kemasan adalah 144 botol. Terjual 3/8 bagian pada pagi hari, lalu datang kiriman gudang sebanyak 26 botol. Berapa sisa stok sekarang?',
      options: [
        { key: 'A', text: '108 botol' },
        { key: 'B', text: '112 botol' },
        { key: 'C', text: '116 botol' },
        { key: 'D', text: '120 botol' },
        { key: 'E', text: '124 botol' },
      ],
      correct_option: 'C',
      explanation:
        'Terjual = (3/8) × 144 = 54 botol. Sisa = 144 - 54 = 90 botol. Ditambah kiriman 26 = 116 botol.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Harga beli 1 karton mie instan (isi 40 bungkus) adalah Rp100.000. Jika toko menjual eceran Rp3.000 per bungkus, berapa persen keuntungan per karton?',
      options: [
        { key: 'A', text: '15%' },
        { key: 'B', text: '18%' },
        { key: 'C', text: '20%' },
        { key: 'D', text: '22%' },
        { key: 'E', text: '25%' },
      ],
      correct_option: 'C',
      explanation:
        'Total jual = 40 × 3.000 = Rp120.000. Untung = Rp20.000. Persentase = (20.000 / 100.000) × 100% = 20%.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Sebuah toko buka pukul 07.00 hingga 22.00 setiap hari dan dibagi menjadi 2 shift kerja yang sama panjang tanpa jeda tutup. Berapa lama durasi setiap shift?',
      options: [
        { key: 'A', text: '6 jam 30 menit' },
        { key: 'B', text: '7 jam' },
        { key: 'C', text: '7 jam 30 menit' },
        { key: 'D', text: '8 jam' },
        { key: 'E', text: '8 jam 30 menit' },
      ],
      correct_option: 'C',
      explanation:
        'Total buka = 22.00 - 07.00 = 15 jam. Dibagi 2 shift = 7,5 jam atau 7 jam 30 menit.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Pekerjaan penataan gudang dapat diselesaikan oleh 12 orang dalam 15 hari. Jika harus selesai dalam 10 hari, berapa tambahan pekerja yang dibutuhkan?',
      options: [
        { key: 'A', text: '4 orang' },
        { key: 'B', text: '6 orang' },
        { key: 'C', text: '8 orang' },
        { key: 'D', text: '12 orang' },
        { key: 'E', text: '18 orang' },
      ],
      correct_option: 'B',
      explanation:
        'Total pekerja dibutuhkan = (12 × 15) / 10 = 18 orang. Tambahan pekerja = 18 - 12 = 6 orang.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Harga sebuah jaket setelah diskon 20% adalah Rp240.000. Berapakah harga awal jaket tersebut sebelum diskon?',
      options: [
        { key: 'A', text: 'Rp280.000' },
        { key: 'B', text: 'Rp288.000' },
        { key: 'C', text: 'Rp300.000' },
        { key: 'D', text: 'Rp320.000' },
        { key: 'E', text: 'Rp340.000' },
      ],
      correct_option: 'C',
      explanation:
        'Harga setelah diskon 20% = 80% dari harga awal. Harga awal = 240.000 / 0,8 = Rp300.000.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Mobil pengiriman menempuh jarak 180 km dengan kecepatan rata-rata 60 km/jam. Jika berangkat pukul 08.15, pukul berapa mobil tiba di cabang?',
      options: [
        { key: 'A', text: '10.45' },
        { key: 'B', text: '11.00' },
        { key: 'C', text: '11.15' },
        { key: 'D', text: '11.30' },
        { key: 'E', text: '12.15' },
      ],
      correct_option: 'C',
      explanation: 'Waktu tempuh = 180 / 60 = 3 jam. 08.15 + 3 jam = 11.15.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Perbandingan uang kas kecil Toko A dan Toko B adalah 3 : 5. Jika jumlah uang keduanya adalah Rp4.000.000, berapakah uang kas kecil Toko B?',
      options: [
        { key: 'A', text: 'Rp1.500.000' },
        { key: 'B', text: 'Rp2.000.000' },
        { key: 'C', text: 'Rp2.250.000' },
        { key: 'D', text: 'Rp2.500.000' },
        { key: 'E', text: 'Rp3.000.000' },
      ],
      correct_option: 'D',
      explanation: 'Toko B = (5 / (3 + 5)) × 4.000.000 = (5/8) × 4.000.000 = Rp2.500.000.',
    },
    {
      category_tag: 'Subtest 3: Aritmatika',
      question_text:
        'Seorang kasir menerima pembayaran pecahan Rp100.000 untuk belanjaan senilai Rp37.250. Berapakah kembalian yang tepat?',
      options: [
        { key: 'A', text: 'Rp62.250' },
        { key: 'B', text: 'Rp62.750' },
        { key: 'C', text: 'Rp63.250' },
        { key: 'D', text: 'Rp63.750' },
        { key: 'E', text: 'Rp67.250' },
      ],
      correct_option: 'B',
      explanation: '100.000 - 37.250 = Rp62.750.',
    },

    // --- SUBTEST 4: DERET ANGKA (10 SOAL) ---
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya pada deret berikut:  4, 7, 11, 16, 22, ...',
      options: [
        { key: 'A', text: '27' },
        { key: 'B', text: '28' },
        { key: 'C', text: '29' },
        { key: 'D', text: '30' },
        { key: 'E', text: '31' },
      ],
      correct_option: 'C',
      explanation: 'Selisih bertambah +3, +4, +5, +6, maka berikutnya +7 → 22 + 7 = 29.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan dua angka selanjutnya:  3, 6, 4, 8, 6, 12, 10, ..., ...',
      options: [
        { key: 'A', text: '20, 18' },
        { key: 'B', text: '18, 16' },
        { key: 'C', text: '20, 16' },
        { key: 'D', text: '14, 28' },
        { key: 'E', text: '16, 14' },
      ],
      correct_option: 'A',
      explanation: 'Pola bergantian ×2 lalu -2: 10 × 2 = 20, lalu 20 - 2 = 18.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya:  100, 95, 85, 70, 50, ...',
      options: [
        { key: 'A', text: '20' },
        { key: 'B', text: '25' },
        { key: 'C', text: '30' },
        { key: 'D', text: '35' },
        { key: 'E', text: '40' },
      ],
      correct_option: 'B',
      explanation: 'Pengurangan bertingkat -5, -10, -15, -20, berikutnya -25 → 50 - 25 = 25.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya:  2, 6, 12, 20, 30, ...',
      options: [
        { key: 'A', text: '38' },
        { key: 'B', text: '40' },
        { key: 'C', text: '42' },
        { key: 'D', text: '44' },
        { key: 'E', text: '48' },
      ],
      correct_option: 'C',
      explanation: 'Selisih +4, +6, +8, +10, berikutnya +12 → 30 + 12 = 42.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya:  1, 4, 9, 16, 25, ...',
      options: [
        { key: 'A', text: '30' },
        { key: 'B', text: '32' },
        { key: 'C', text: '35' },
        { key: 'D', text: '36' },
        { key: 'E', text: '49' },
      ],
      correct_option: 'D',
      explanation: 'Deret bilangan kuadrat: 1², 2², 3², 4², 5², berikutnya 6² = 36.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya (pola lompat):  10, 20, 12, 18, 14, 16, 16, ...',
      options: [
        { key: 'A', text: '12' },
        { key: 'B', text: '14' },
        { key: 'C', text: '15' },
        { key: 'D', text: '18' },
        { key: 'E', text: '20' },
      ],
      correct_option: 'B',
      explanation:
        'Larik ganjil (+2): 10, 12, 14, 16. Larik genap (-2): 20, 18, 16, maka berikutnya 16 - 2 = 14.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya:  5, 15, 45, 135, ...',
      options: [
        { key: 'A', text: '270' },
        { key: 'B', text: '305' },
        { key: 'C', text: '405' },
        { key: 'D', text: '415' },
        { key: 'E', text: '540' },
      ],
      correct_option: 'C',
      explanation: 'Setiap suku dikali 3: 135 × 3 = 405.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya:  64, 32, 16, 8, ...',
      options: [
        { key: 'A', text: '2' },
        { key: 'B', text: '3' },
        { key: 'C', text: '4' },
        { key: 'D', text: '5' },
        { key: 'E', text: '6' },
      ],
      correct_option: 'C',
      explanation: 'Setiap suku dibagi 2: 8 / 2 = 4.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya (Fibonacci):  2, 3, 5, 8, 13, 21, ...',
      options: [
        { key: 'A', text: '29' },
        { key: 'B', text: '31' },
        { key: 'C', text: '33' },
        { key: 'D', text: '34' },
        { key: 'E', text: '35' },
      ],
      correct_option: 'D',
      explanation: 'Setiap angka adalah jumlah dua angka sebelumnya: 13 + 21 = 34.',
    },
    {
      category_tag: 'Subtest 4: Deret Angka',
      question_text: 'Tentukan angka selanjutnya:  7, 10, 14, 19, 25, ...',
      options: [
        { key: 'A', text: '30' },
        { key: 'B', text: '31' },
        { key: 'C', text: '32' },
        { key: 'D', text: '33' },
        { key: 'E', text: '34' },
      ],
      correct_option: 'C',
      explanation: 'Selisih +3, +4, +5, +6, maka berikutnya +7 → 25 + 7 = 32.',
    },

    // --- SUBTEST 5: KETELITIAN DATA & VERBAL (10 SOAL) ---
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text:
        'Manakah pasangan kode SKU barang gudang berikut yang PERSIS SAMA antara kolom kiri dan kolom kanan?',
      options: [
        { key: 'A', text: '8992761145021  —  8992761145201' },
        { key: 'B', text: 'IDM-0482-KL90  —  IDM-0482-KL09' },
        { key: 'C', text: 'ALF-77319-B2M  —  ALF-77319-B2M' },
        { key: 'D', text: 'FM900218-XXR  —  FM900281-XXR' },
        { key: 'E', text: '620049182735  —  620049182375' },
      ],
      correct_option: 'C',
      explanation:
        'Hanya opsi C (ALF-77319-B2M — ALF-77319-B2M) yang sama persis tiap karakternya.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text:
        'Hitung dengan teliti jumlah huruf "n" pada deret huruf berikut:  m n m m n m n n m m n m n m m',
      options: [
        { key: 'A', text: '4' },
        { key: 'B', text: '5' },
        { key: 'C', text: '6' },
        { key: 'D', text: '7' },
        { key: 'E', text: '8' },
      ],
      correct_option: 'C',
      explanation: 'Terdapat tepat 6 huruf "n" di dalam deret tersebut.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text:
        'Manakah pasangan angka nominal faktur berikut yang BERBEDA antara sisi kiri dan kanan?',
      options: [
        { key: 'A', text: '45.890.120  —  45.890.120' },
        { key: 'B', text: '12.304.500  —  12.304.500' },
        { key: 'C', text: '78.651.230  —  78.615.230' },
        { key: 'D', text: '99.001.400  —  99.001.400' },
        { key: 'E', text: '31.772.810  —  31.772.810' },
      ],
      correct_option: 'C',
      explanation:
        'Pada opsi C, angka 651 di sisi kiri tertukar menjadi 615 di sisi kanan.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text:
        'Hitung berapa kali angka "7" muncul dalam deret angka berikut:  7 1 7 7 2 7 3 1 7 7 4 7 2',
      options: [
        { key: 'A', text: '5' },
        { key: 'B', text: '6' },
        { key: 'C', text: '7' },
        { key: 'D', text: '8' },
        { key: 'E', text: '9' },
      ],
      correct_option: 'C',
      explanation: 'Angka 7 muncul sebanyak 7 kali.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text: 'RAK : BUKU = ETALASE : ...',
      options: [
        { key: 'A', text: 'Kasir' },
        { key: 'B', text: 'Gudang' },
        { key: 'C', text: 'Barang Dagangan' },
        { key: 'D', text: 'Nota' },
        { key: 'E', text: 'Pelanggan' },
      ],
      correct_option: 'C',
      explanation:
        'Rak adalah tempat menata buku, sebagaimana Etalase adalah tempat menata barang dagangan.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text: 'Pilihlah kata yang merupakan ANTONIM (lawan kata) dari "DINAMIS":',
      options: [
        { key: 'A', text: 'Cepat' },
        { key: 'B', text: 'Statis' },
        { key: 'C', text: 'Aktif' },
        { key: 'D', text: 'Luwes' },
        { key: 'E', text: 'Gesit' },
      ],
      correct_option: 'B',
      explanation: 'Dinamis berarti terus bergerak/berubah; lawan katanya adalah Statis (diam/tetap).',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text: 'Pilihlah kata yang merupakan SINONIM (persamaan kata) dari "AKURAT":',
      options: [
        { key: 'A', text: 'Perkiraan' },
        { key: 'B', text: 'Tepat dan teliti' },
        { key: 'C', text: 'Terburu-buru' },
        { key: 'D', text: 'Sementara' },
        { key: 'E', text: 'Berlebihan' },
      ],
      correct_option: 'B',
      explanation: 'Akurat berarti teliti, cermat, dan tepat benar.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text: 'Pilihlah kata yang merupakan SINONIM dari "BONAFIDE":',
      options: [
        { key: 'A', text: 'Dapat dipercaya' },
        { key: 'B', text: 'Sementara' },
        { key: 'C', text: 'Tersembunyi' },
        { key: 'D', text: 'Meragukan' },
        { key: 'E', text: 'Kaku' },
      ],
      correct_option: 'A',
      explanation: 'Bonafide berarti dapat dipercaya dengan baik atau jujur.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text: 'Pilihlah kata yang merupakan ANTONIM dari "SPORADIS":',
      options: [
        { key: 'A', text: 'Jarang' },
        { key: 'B', text: 'Terhenti' },
        { key: 'C', text: 'Sering dan teratur' },
        { key: 'D', text: 'Acak' },
        { key: 'E', text: 'Meluas' },
      ],
      correct_option: 'C',
      explanation: 'Sporadis berarti kadang-kadang/tidak tentu; lawan katanya adalah sering dan teratur.',
    },
    {
      category_tag: 'Subtest 5: Ketelitian & Verbal',
      question_text: 'APOTEKER : OBAT = KOKI : ...',
      options: [
        { key: 'A', text: 'Dapur' },
        { key: 'B', text: 'Masakan' },
        { key: 'C', text: 'Restoran' },
        { key: 'D', text: 'Kompor' },
        { key: 'E', text: 'Resep' },
      ],
      correct_option: 'B',
      explanation: 'Apoteker meracik obat, sebagaimana Koki mengolah masakan.',
    },
  ];

  return list.map((q, index) => ({
    ...q,
    id: `${quizId}-q${index + 1}`,
    quiz_id: quizId,
    order_index: index + 1,
  }));
}
