import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Layers,
  Lock,
  LogIn,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { useAuthStore } from '../auth/useAuthStore';
import { CatalogFilterPanel, type ProgramTypeFilter } from './CatalogFilterPanel';
import { CatalogHeroBento } from './CatalogHeroBento';
import { CatalogPersonalizationSection } from './CatalogPersonalizationSection';
import { CourseSyllabusDrawer } from './CourseSyllabusDrawer';
import { getSavedDailyXpTarget, syncStudyPreferencesFromServer } from './learningGoalStorage';

const PAGE_SIZE = 6;
type SortOption = 'default' | 'title_asc' | 'duration_asc' | 'duration_desc';

export function CatalogPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedType, setSelectedType] = useState<ProgramTypeFilter>('Semua');
  const [selectedLevel, setSelectedLevel] = useState('Semua');

  // Staged (draft) filter state — only committed when user clicks "Terapkan"
  const [draftCategory, setDraftCategory] = useState('Semua');
  const [draftType, setDraftType] = useState<ProgramTypeFilter>('Semua');
  const [draftLevel, setDraftLevel] = useState('Semua');

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const openMobileFilter = () => {
    setDraftCategory(selectedCategory);
    setDraftType(selectedType);
    setDraftLevel(selectedLevel);
    setMobileFilterOpen(true);
  };

  const closeMobileFilterWithoutApplying = () => {
    setDraftCategory(selectedCategory);
    setDraftType(selectedType);
    setDraftLevel(selectedLevel);
    setMobileFilterOpen(false);
  };

  const applyDraftFilters = () => {
    setSelectedCategory(draftCategory);
    setSelectedType(draftType);
    setSelectedLevel(draftLevel);
    setCurrentPage(1);
    setMobileFilterOpen(false);
  };

  useEffect(() => {
    if (!mobileFilterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraftCategory(selectedCategory);
        setDraftType(selectedType);
        setDraftLevel(selectedLevel);
        setMobileFilterOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileFilterOpen, selectedCategory, selectedType, selectedLevel]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<{ course: Course; targetUrl: string } | null>(
    null
  );

  const handleOpenTarget = (e: React.MouseEvent, targetUrl: string) => {
    if (!user) {
      e.preventDefault();
      setShowAuthDialog(true);
      return;
    }
    navigate(targetUrl);
  };

  const { data: courses = [], isLoading, isError, refetch } = useQueryPlaceholder();
  const { data: enrolledIds = [] } = useEnrollmentsQuery(user?.id);
  const { data: completedLessonIds = [] } = useCompletedLessonsQuery(user?.id);
  const { data: userAttempts = [] } = useUserAttemptsQuery(user?.id);
  const { data: inProgressAttempts = [] } = useInProgressAttemptsQuery(user?.id);
  const { data: ratingSummaries = {} } = useQuery({
    queryKey: ['course-rating-summaries'],
    queryFn: () => lmsApi.listAllCourseRatingSummaries(),
  });
  const { data: studyPrefs } = useQuery({
    queryKey: ['study-preferences', user?.id],
    queryFn: () => syncStudyPreferencesFromServer(user?.id),
  });

  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));
  const earnedToday = useMemo(() => {
    return userAttempts.reduce((sum, att) => {
      if (!att.submitted_at || !att.submitted_at.startsWith(todayStr)) return sum;
      const passedBonus = (att.score ?? 0) >= 70 ? 35 : 0;
      return sum + 40 + passedBonus;
    }, 0);
  }, [userAttempts, todayStr]);
  const xpTarget = studyPrefs?.xpTarget ?? getSavedDailyXpTarget();

  const getDirectQuiz = (course: Course) => {
    const lessons = (course.modules ?? []).flatMap((m) => m.lessons);
    if (lessons.length === 1 && lessons[0].type === 'quiz' && lessons[0].quiz) {
      return lessons[0].quiz;
    }
    return null;
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: courses.length };
    for (const c of courses) {
      counts[c.category] = (counts[c.category] ?? 0) + 1;
    }
    return counts;
  }, [courses]);

  const categories = useMemo(() => Object.keys(categoryCounts), [categoryCounts]);
  const levels = ['Semua', 'Pemula', 'Menengah', 'Lanjutan', 'Semua Level'];

  const filteredCourses = useMemo(() => {
    const filtered = courses.filter((c) => {
      const isDirect = Boolean(getDirectQuiz(c));
      const matchCat = selectedCategory === 'Semua' || c.category === selectedCategory;
      const matchType =
        selectedType === 'Semua' ||
        (selectedType === 'Latihan' && isDirect) ||
        (selectedType === 'Kursus' && !isDirect);
      const matchLevel = selectedLevel === 'Semua' || c.level === selectedLevel;
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchType && matchLevel && matchSearch;
    });

    if (sortBy === 'title_asc') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'duration_asc') {
      return [...filtered].sort((a, b) => a.estimated_hours - b.estimated_hours);
    }
    if (sortBy === 'duration_desc') {
      return [...filtered].sort((a, b) => b.estimated_hours - a.estimated_hours);
    }
    return filtered;
  }, [courses, selectedCategory, selectedType, selectedLevel, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCourses = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, safePage]);

  const visiblePages = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    return pages;
  }, [totalPages, safePage]);

  const activeFilterCount =
    (selectedCategory !== 'Semua' ? 1 : 0) +
    (selectedType !== 'Semua' ? 1 : 0) +
    (selectedLevel !== 'Semua' ? 1 : 0);

  const draftFilterCount =
    (draftCategory !== 'Semua' ? 1 : 0) +
    (draftType !== 'Semua' ? 1 : 0) +
    (draftLevel !== 'Semua' ? 1 : 0);

  const draftMatchedCount = useMemo(() => {
    return courses.filter((c) => {
      const isDirect = Boolean(getDirectQuiz(c));
      const matchCat = draftCategory === 'Semua' || c.category === draftCategory;
      const matchType =
        draftType === 'Semua' ||
        (draftType === 'Latihan' && isDirect) ||
        (draftType === 'Kursus' && !isDirect);
      const matchLevel = draftLevel === 'Semua' || c.level === draftLevel;
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchType && matchLevel && matchSearch;
    }).length;
  }, [courses, draftCategory, draftType, draftLevel, search]);

  const resetDraftFilters = () => {
    setDraftCategory('Semua');
    setDraftType('Semua');
    setDraftLevel('Semua');
  };

  const resetAllFilters = () => {
    setSelectedCategory('Semua');
    setSelectedType('Semua');
    setSelectedLevel('Semua');
    setDraftCategory('Semua');
    setDraftType('Semua');
    setDraftLevel('Semua');
    setSearch('');
    setSortBy('default');
    setCurrentPage(1);
  };

  const structuredCourse =
    courses.find((c) => c.category === 'Kursus Terstruktur') ?? courses[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <CatalogHeroBento
        userName={user?.full_name}
        isLoggedIn={Boolean(user)}
        earnedToday={earnedToday}
        xpTarget={xpTarget}
        totalCourses={courses.length}
        isLoading={isLoading}
        primaryCourseSlug={structuredCourse?.slug}
        onOpenTarget={handleOpenTarget}
      />

      <CatalogPersonalizationSection
        courses={courses}
        enrolledIds={enrolledIds}
        completedIds={completedLessonIds}
        attemptsCount={userAttempts.length}
        attempts={userAttempts}
        isLoggedIn={Boolean(user)}
        userId={user?.id}
        onOpenTarget={handleOpenTarget}
      />

      {/* Marketplace Catalog Section */}
      <section id="katalog" className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B] dark:text-white">
            Kursus &amp; Latihan
          </h2>
          <p className="text-sm text-[#52525B] dark:text-slate-400 mt-0.5">
            Gunakan filter di samping untuk menemukan kursus atau latihan soal sesuai kebutuhan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Marketplace Left Filter Sidebar (Auto-Apply) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-4 sticky top-24">
            <CatalogFilterPanel
              activeFilterCount={
                (selectedType !== 'Semua' ? 1 : 0) +
                (selectedCategory !== 'Semua' ? 1 : 0) +
                (selectedLevel !== 'Semua' ? 1 : 0)
              }
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              selectedLevel={selectedLevel}
              categories={categories}
              categoryCounts={categoryCounts}
              levels={levels}
              onSelectType={(t) => {
                setSelectedType(t);
                setDraftType(t);
                setCurrentPage(1);
              }}
              onSelectCategory={(c) => {
                setSelectedCategory(c);
                setDraftCategory(c);
                setCurrentPage(1);
              }}
              onSelectLevel={(l) => {
                setSelectedLevel(l);
                setDraftLevel(l);
                setCurrentPage(1);
              }}
              onReset={resetAllFilters}
            />
          </aside>

          {/* Right Marketplace Content Area */}
          <div className="lg:col-span-9 space-y-5">
            {/* Top Marketplace Toolbar */}
            <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={openMobileFilter}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-[#1A202C] text-xs font-semibold text-[#18181B] dark:text-white shrink-0 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-sm bg-[#0F766E] text-white text-[10px] font-mono">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#71717A] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari kursus atau latihan..."
                    className="w-full pl-10 pr-4 py-1.5 bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] rounded text-sm text-[#18181B] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs text-[#71717A] dark:text-slate-400 font-medium">
                  {isLoading ? (
                    'Memuat program...'
                  ) : (
                    <>
                      <strong className="text-[#18181B] dark:text-white font-mono">
                        {filteredCourses.length}
                      </strong>{' '}
                      program
                    </>
                  )}
                </span>

                <div className="relative">
                  <select
                    aria-label="Urutkan program"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none pl-3 pr-8 py-1.5 bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] rounded text-xs font-medium text-[#18181B] dark:text-slate-100 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
                  >
                    <option value="default">Urutkan: Rekomendasi</option>
                    <option value="title_asc">Urutkan: Judul A–Z</option>
                    <option value="duration_asc">Durasi: Tercepat</option>
                    <option value="duration_desc">Durasi: Terlama</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717A] dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {(activeFilterCount > 0 || search.trim() !== '') && (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedType !== 'Semua' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('Semua');
                      setDraftType('Semua');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-[#0F766E]/40 text-[11px] font-mono text-[#0F766E] dark:text-teal-300 cursor-pointer"
                  >
                    Tipe: {selectedType === 'Kursus' ? 'Kursus Terstruktur' : 'Latihan Langsung'}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedCategory !== 'Semua' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Semua');
                      setDraftCategory('Semua');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-[#0F766E]/40 text-[11px] font-mono text-[#0F766E] dark:text-teal-300 cursor-pointer"
                  >
                    Kategori: {selectedCategory}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedLevel !== 'Semua' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel('Semua');
                      setDraftLevel('Semua');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-[#0F766E]/40 text-[11px] font-mono text-[#0F766E] dark:text-teal-300 cursor-pointer"
                  >
                    Level: {selectedLevel}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {search.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-[#D4D4CE] dark:border-[#282E3D] text-[11px] font-mono text-[#18181B] dark:text-slate-200 cursor-pointer"
                  >
                    Cari: "{search}"
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-mono font-medium text-[#71717A] dark:text-slate-400 hover:text-[#18181B] dark:hover:text-white underline ml-1 cursor-pointer"
                >
                  Hapus semua
                </button>
              </div>
            )}

            {/* Course Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-5 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="space-y-3 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                      </div>
                      <div className="h-5 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="space-y-2 pt-1">
                        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
                        <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800/70" />
                        <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/70" />
                      </div>
                    </div>
                    <div className="pt-3.5 border-t border-[#D4D4CE] dark:border-[#282E3D] flex items-center justify-between animate-pulse">
                      <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-10 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                  Gagal memuat daftar program dari server.
                </p>
                <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                  Coba Lagi
                </Button>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-12 text-center space-y-3">
                <p className="text-sm font-medium text-[#52525B] dark:text-slate-300">
                  Tidak ada kursus atau latihan yang cocok dengan filter Anda.
                </p>
                <Button variant="secondary" size="sm" onClick={resetAllFilters}>
                  Reset Filter
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paginatedCourses.map((course) => {
                    const directQuiz = getDirectQuiz(course);
                    const directAttempt = directQuiz
                      ? userAttempts.find((a) => a.quiz_id === directQuiz.id && a.submitted_at)
                      : undefined;
                    const directInProgress = directQuiz
                      ? inProgressAttempts.find(
                          (a) => a.quiz_id === directQuiz.id && !a.submitted_at
                        )
                      : undefined;

                    const isEnrolled = enrolledIds.includes(course.id);
                    const allLessons = (course.modules ?? []).flatMap((m) => m.lessons);
                    const completedCount = allLessons.filter((l) =>
                      completedLessonIds.includes(l.id)
                    ).length;
                    const progressPct =
                      allLessons.length > 0
                        ? Math.round((completedCount / allLessons.length) * 100)
                        : 0;

                    const targetUrl = directQuiz
                      ? directAttempt
                        ? `/quiz/${directQuiz.id}/result/${directAttempt.id}`
                        : `/quiz/${directQuiz.id}`
                      : `/courses/${course.slug}`;

                    return (
                      <div
                        key={course.id}
                        className="group relative pointer-events-none bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg p-5 flex flex-col justify-between hover:border-[#0F766E] dark:hover:border-[#14B8A6] active:scale-[0.995] transition-[border-color,background-color] duration-150"
                      >
                        <Link
                          to={targetUrl}
                          onClick={(e) => handleOpenTarget(e, targetUrl)}
                          aria-label={course.title}
                          className="pointer-events-auto absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0F766E]"
                        />
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge tone={directQuiz ? 'amber' : 'blue'}>{course.category}</Badge>
                            {directAttempt ? (
                              <Badge tone="emerald">
                                <CheckCircle2 className="w-3 h-3" />
                                Skor {directAttempt.score}%
                              </Badge>
                            ) : directInProgress ? (
                              <Badge tone="amber">
                                <Clock className="w-3 h-3" />
                                Sedang Dikerjakan
                              </Badge>
                            ) : isEnrolled && !directQuiz ? (
                              <Badge tone="emerald">
                                <CheckCircle2 className="w-3 h-3" />
                                Terdaftar
                              </Badge>
                            ) : null}
                          </div>

                          <h3 className="text-base font-bold text-[#18181B] dark:text-white group-hover:text-[#0F766E] dark:group-hover:text-teal-400 transition-colors leading-snug">
                            {course.title}
                          </h3>

                          {ratingSummaries[course.id] && (
                            <p className="text-xs font-semibold text-amber-500">
                              ★ {ratingSummaries[course.id].avg}{' '}
                              <span className="text-[#71717A] dark:text-slate-400 font-normal">
                                ({ratingSummaries[course.id].count} ulasan)
                              </span>
                            </p>
                          )}

                          <p className="text-xs sm:text-sm text-[#52525B] dark:text-slate-400 line-clamp-3 leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-[#D4D4CE] dark:border-[#282E3D] space-y-2.5">
                          {!directQuiz && isEnrolled && allLessons.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#71717A] dark:text-slate-400 font-medium">
                                  Progres Belajar
                                </span>
                                <span className="font-mono-tabular font-semibold text-[#18181B] dark:text-white">
                                  {progressPct}%
                                </span>
                              </div>
                              <ProgressBar value={progressPct} tone="emerald" />
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
                            {directQuiz ? (
                              <>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {directQuiz.duration_minutes} Mnt
                                </span>
                                <span className="inline-flex items-center gap-1 font-semibold text-[#0F766E] dark:text-teal-400">
                                  {directAttempt ? (
                                    <>
                                      <FileCheck2 className="w-3.5 h-3.5" />
                                      Ringkasan
                                    </>
                                  ) : directInProgress ? (
                                    <>
                                      <ClipboardCheck className="w-3.5 h-3.5" />
                                      Lanjutkan Tes
                                    </>
                                  ) : (
                                    <>
                                      <ClipboardCheck className="w-3.5 h-3.5" />
                                      Kerjakan
                                    </>
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2.5">
                                  <span className="inline-flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5" />
                                    {allLessons.length} Materi
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {course.estimated_hours} Jam
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewCourse({ course, targetUrl })}
                                    className="pointer-events-auto relative z-10 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300 hover:text-[#0F766E] dark:hover:text-teal-400 font-semibold transition-colors cursor-pointer"
                                    title="Pratinjau silabus kursus"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Silabus
                                  </button>
                                  <span className="inline-flex items-center gap-1 font-semibold text-[#0F766E] dark:text-teal-400">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Buka
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Bar */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#D4D4CE] dark:border-[#282E3D]">
                    <p className="text-xs text-[#71717A] dark:text-slate-400">
                      Halaman{' '}
                      <span className="font-semibold text-[#18181B] dark:text-white">
                        {currentPage}
                      </span>{' '}
                      dari{' '}
                      <span className="font-semibold text-[#18181B] dark:text-white">
                        {totalPages}
                      </span>{' '}
                      ({filteredCourses.length} program)
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Sebelumnya
                      </Button>
                      {visiblePages.map((item, idx) =>
                        item === 'ellipsis' ? (
                          <span
                            key={`el-${idx}`}
                            className="px-1.5 text-xs text-[#71717A] dark:text-slate-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setCurrentPage(item)}
                            className={`w-8 h-8 rounded-lg text-xs font-mono-tabular font-semibold border transition-colors cursor-pointer ${
                              currentPage === item
                                ? 'bg-[#0F766E] border-[#0F766E] text-white'
                                : 'bg-white dark:bg-[#161B22] border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Berikutnya
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile / Tablet Filter Drawer Modal */}
      {mobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Marketplace"
          onClick={closeMobileFilterWithoutApplying}
          className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-xs flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-white dark:bg-[#161B22] h-full flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4D4CE] dark:border-[#282E3D] shrink-0">
              <span className="font-bold text-base text-[#18181B] dark:text-white">
                Filter Marketplace
              </span>
              <button
                type="button"
                aria-label="Tutup filter"
                onClick={closeMobileFilterWithoutApplying}
                className="p-1.5 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CatalogFilterPanel
                activeFilterCount={draftFilterCount}
                selectedType={draftType}
                selectedCategory={draftCategory}
                selectedLevel={draftLevel}
                categories={categories}
                categoryCounts={categoryCounts}
                levels={levels}
                onSelectType={(t) => setDraftType(t)}
                onSelectCategory={(c) => setDraftCategory(c)}
                onSelectLevel={(l) => setDraftLevel(l)}
                onReset={resetDraftFilters}
              />
            </div>
            <div className="p-4 border-t border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22] shrink-0">
              <Button type="button" className="w-full" onClick={applyDraftFilters}>
                Terapkan ({draftMatchedCount} Program)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Dialog */}
      {showAuthDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#18181B] dark:text-white">
                  Masuk untuk Mengakses Kursus &amp; Latihan
                </h3>
                <p className="text-sm text-[#52525B] dark:text-slate-400 mt-1 leading-relaxed">
                  Silakan masuk ke akun Anda terlebih dahulu untuk membuka materi, menyimpan
                  progres belajar, dan mengerjakan latihan soal.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="secondary" onClick={() => setShowAuthDialog(false)}>
                Nanti Saja
              </Button>
              <Button
                onClick={() => {
                  setShowAuthDialog(false);
                  navigate('/auth');
                }}
              >
                <LogIn className="w-4 h-4" />
                Masuk Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Syllabus Preview Slide-Over Drawer */}
      <CourseSyllabusDrawer
        course={previewCourse?.course ?? null}
        targetUrl={previewCourse?.targetUrl ?? ''}
        onClose={() => setPreviewCourse(null)}
        onStartCourse={handleOpenTarget}
      />
    </div>
  );
}

// Local query hooks for clean separation
import { useQuery } from '@tanstack/react-query';

function useQueryPlaceholder() {
  return useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => lmsApi.listPublishedCourses(),
  });
}

function useEnrollmentsQuery(userId?: string) {
  return useQuery({
    queryKey: ['enrollments', userId],
    queryFn: () => (userId ? lmsApi.getUserEnrollments(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
  });
}

function useCompletedLessonsQuery(userId?: string) {
  return useQuery({
    queryKey: ['lesson-progress', userId],
    queryFn: () => (userId ? lmsApi.getCompletedLessonIds(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
  });
}

function useUserAttemptsQuery(userId?: string) {
  return useQuery({
    queryKey: ['quiz-attempts', userId],
    queryFn: () => (userId ? lmsApi.listUserAttempts(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
  });
}

function useInProgressAttemptsQuery(userId?: string) {
  return useQuery({
    queryKey: ['quiz-attempts-inprogress', userId],
    queryFn: () => (userId ? lmsApi.listInProgressAttempts(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
  });
}
