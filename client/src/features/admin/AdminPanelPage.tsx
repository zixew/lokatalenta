import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import type { UserRole } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import { AdminAuditLogPanel } from './AdminAuditLogPanel';
import {
  recordAdminAuditLogAsync,
  syncAdminAuditLogsFromServer,
} from './adminAuditLog';
import {
  buildAuditLogsCsv,
  buildUsersCsv,
  downloadCsvFile,
} from './adminCsvExport';

type AdminTab = 'users' | 'courses' | 'audit';
const USER_PAGE_SIZE = 10;
const COURSE_PAGE_SIZE = 10;

export function AdminPanelPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: syncAdminAuditLogsFromServer,
  });

  // User filters & pagination
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userPage, setUserPage] = useState(1);

  // Course filters & pagination
  const [courseSearch, setCourseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [coursePage, setCoursePage] = useState(1);

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: () => lmsApi.listAllProfiles(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => lmsApi.listAllCoursesForManagement(),
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      lmsApi.updateUserRole(userId, role),
    onSuccess: async (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      const targetUser = profiles.find((p) => p.id === vars.userId);
      const updated = await recordAdminAuditLogAsync({
        actorId: currentUser?.id,
        actorName: currentUser?.full_name || 'Admin',
        action: 'ROLE_UPDATED',
        targetLabel: targetUser?.email || vars.userId,
        detail: `Mengubah role menjadi ${vars.role}`,
      });
      queryClient.setQueryData(['admin-audit-logs'], updated);
    },
  });

  const togglePublishMut = useMutation({
    mutationFn: ({ courseId, isPublished }: { courseId: string; isPublished: boolean }) =>
      lmsApi.toggleCoursePublish(courseId, isPublished),
    onSuccess: async (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      const targetCourse = courses.find((c) => c.id === vars.courseId);
      const updated = await recordAdminAuditLogAsync({
        actorId: currentUser?.id,
        actorName: currentUser?.full_name || 'Admin',
        action: 'COURSE_PUBLISH_TOGGLED',
        targetLabel: targetCourse?.title || vars.courseId,
        detail: vars.isPublished ? 'Menerbitkan kursus ke katalog' : 'Menarik kursus ke draft',
      });
      queryClient.setQueryData(['admin-audit-logs'], updated);
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      lmsApi.toggleUserActive(userId, isActive),
    onSuccess: async (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      const targetUser = profiles.find((p) => p.id === vars.userId);
      const updated = await recordAdminAuditLogAsync({
        actorId: currentUser?.id,
        actorName: currentUser?.full_name || 'Admin',
        action: 'USER_STATUS_CHANGED',
        targetLabel: targetUser?.email || vars.userId,
        detail: vars.isActive ? 'Mengaktifkan kembali akun' : 'Menonaktifkan akun',
      });
      queryClient.setQueryData(['admin-audit-logs'], updated);
    },
  });

  const filteredProfiles = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return profiles.filter((p) => {
      if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      const isActive = p.is_active !== false;
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'inactive' && isActive) return false;
      if (q && !`${p.full_name} ${p.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [profiles, userSearch, roleFilter, statusFilter]);

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(courses.map((c) => c.category)))],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return courses.filter((c) => {
      if (categoryFilter !== 'Semua' && c.category !== categoryFilter) return false;
      if (publishFilter === 'published' && !c.is_published) return false;
      if (publishFilter === 'draft' && c.is_published) return false;
      if (q && !`${c.title} ${c.category} ${c.teacher_name ?? ''}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [courses, courseSearch, categoryFilter, publishFilter]);

  const totalUserPages = Math.max(1, Math.ceil(filteredProfiles.length / USER_PAGE_SIZE));
  const safeUserPage = Math.min(userPage, totalUserPages);
  const pagedProfiles = filteredProfiles.slice(
    (safeUserPage - 1) * USER_PAGE_SIZE,
    safeUserPage * USER_PAGE_SIZE
  );

  const totalCoursePages = Math.max(1, Math.ceil(filteredCourses.length / COURSE_PAGE_SIZE));
  const safeCoursePage = Math.min(coursePage, totalCoursePages);
  const pagedCourses = filteredCourses.slice(
    (safeCoursePage - 1) * COURSE_PAGE_SIZE,
    safeCoursePage * COURSE_PAGE_SIZE
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#18181B] dark:text-white">Admin Panel</h1>
        <p className="text-sm text-[#52525B] dark:text-slate-300 mt-0.5">
          Kelola hak akses pengguna serta moderasi publikasi kursus dengan pencarian dan filter cepat.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#71717A] dark:text-slate-400 block">Total Pengguna</span>
            <span className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              {profiles.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#71717A] dark:text-slate-400 block">Kursus Terbit</span>
            <span className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              {courses.filter((c) => c.is_published).length} / {courses.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#D97706] dark:text-amber-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#71717A] dark:text-slate-400 block">Jumlah Pengajar</span>
            <span className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              {profiles.filter((p) => p.role === 'teacher').length}
            </span>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E3DC] dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Manajemen Pengguna ({profiles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Moderasi Kursus ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5E3DC] dark:border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Cari nama atau email pengguna..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'student', 'teacher', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoleFilter(r);
                      setUserPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      roleFilter === r
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    {r === 'all'
                      ? 'Semua Role'
                      : r === 'student'
                      ? 'Pelajar'
                      : r === 'teacher'
                      ? 'Pengajar'
                      : 'Admin'}
                  </button>
                ))}
                {(['all', 'active', 'inactive'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setUserPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#18181B]'
                        : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    {st === 'all' ? 'Semua Status' : st === 'active' ? 'Aktif' : 'Nonaktif'}
                  </button>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filteredProfiles.length === 0}
                  onClick={() =>
                    downloadCsvFile(
                      `lokatalenta-users-${new Date().toISOString().slice(0, 10)}.csv`,
                      buildUsersCsv(filteredProfiles)
                    )
                  }
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh CSV Pengguna
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Stacked Cards (390px) */}
          <div className="md:hidden divide-y divide-[#E5E3DC] dark:divide-slate-800">
            {pagedProfiles.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#71717A]">
                Tidak ada pengguna yang sesuai dengan filter.
              </div>
            ) : (
              pagedProfiles.map((p) => {
                const isSelf = p.id === currentUser?.id;
                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#18181B] dark:text-white truncate">
                          {p.full_name}
                        </p>
                        <p className="text-xs text-[#71717A] dark:text-slate-400 truncate">
                          {p.email}
                        </p>
                      </div>
                      <Badge
                        tone={
                          p.role === 'admin' ? 'amber' : p.role === 'teacher' ? 'blue' : 'emerald'
                        }
                      >
                        {p.role === 'student' ? 'Pelajar' : p.role === 'teacher' ? 'Pengajar' : 'Admin'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['student', 'teacher', 'admin'] as UserRole[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          disabled={updateRoleMut.isPending || isSelf}
                          onClick={() => updateRoleMut.mutate({ userId: p.id, role })}
                          className={`py-1.5 rounded-md text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            p.role === role
                              ? 'bg-[#0F766E] text-white'
                              : 'border border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300'
                          }`}
                        >
                          {role === 'student' ? 'Pelajar' : role === 'teacher' ? 'Pengajar' : 'Admin'}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant={p.is_active === false ? 'primary' : 'danger'}
                      size="sm"
                      className="w-full"
                      disabled={toggleActiveMut.isPending || isSelf}
                      onClick={() =>
                        toggleActiveMut.mutate({ userId: p.id, isActive: p.is_active === false })
                      }
                    >
                      {isSelf
                        ? 'Akun Aktif (Anda)'
                        : p.is_active === false
                          ? 'Aktifkan Akun'
                          : 'Nonaktifkan'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6F5F1] dark:bg-slate-900 border-b border-[#E5E3DC] dark:border-slate-800 text-xs font-semibold text-[#71717A] dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Pengguna</th>
                  <th className="px-6 py-3">Role Saat Ini</th>
                  <th className="px-6 py-3">Atur Role Cepat</th>
                  <th className="px-6 py-3 text-right">Status Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                {pagedProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-xs text-[#71717A]">
                      Tidak ada pengguna yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  pagedProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-[#18181B] dark:text-white">{p.full_name}</p>
                        <p className="text-xs text-[#71717A] dark:text-slate-400">{p.email}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          tone={
                            p.role === 'admin' ? 'amber' : p.role === 'teacher' ? 'blue' : 'emerald'
                          }
                        >
                          {p.role === 'student'
                            ? 'Pelajar'
                            : p.role === 'teacher'
                            ? 'Pengajar'
                            : 'Admin'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="inline-flex rounded-lg border border-[#E5E3DC] dark:border-slate-700 overflow-hidden">
                          {(['student', 'teacher', 'admin'] as UserRole[]).map((roleOpt) => {
                            const isSelf = p.id === currentUser?.id;
                            return (
                              <button
                                key={roleOpt}
                                type="button"
                                disabled={isSelf || updateRoleMut.isPending}
                                title={
                                  isSelf
                                    ? 'Tidak dapat mengubah role akun Anda sendiri'
                                    : undefined
                                }
                                onClick={() =>
                                  updateRoleMut.mutate({ userId: p.id, role: roleOpt })
                                }
                                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                                  isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                } ${
                                  p.role === roleOpt
                                    ? 'bg-[#0F766E] text-white'
                                    : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {roleOpt === 'student'
                                  ? 'Pelajar'
                                  : roleOpt === 'teacher'
                                  ? 'Pengajar'
                                  : 'Admin'}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {(() => {
                          const isSelf = p.id === currentUser?.id;
                          return (
                            <Button
                              variant={p.is_active === false ? 'secondary' : 'ghost'}
                              size="sm"
                              disabled={isSelf || toggleActiveMut.isPending}
                              title={
                                isSelf
                                  ? 'Tidak dapat menonaktifkan akun Anda sendiri'
                                  : undefined
                              }
                              onClick={() =>
                                toggleActiveMut.mutate({
                                  userId: p.id,
                                  isActive: p.is_active === false,
                                })
                              }
                            >
                              {isSelf
                                ? 'Akun Aktif (Anda)'
                                : p.is_active === false
                                ? 'Aktifkan Akun'
                                : 'Nonaktifkan'}
                            </Button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalUserPages > 1 && (
            <div className="px-6 py-3.5 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
              <span>
                Halaman {safeUserPage} dari {totalUserPages} ({filteredProfiles.length} pengguna)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safeUserPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safeUserPage >= totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: COURSE MODERATION */}
      {activeTab === 'courses' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5E3DC] dark:border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => {
                    setCourseSearch(e.target.value);
                    setCoursePage(1);
                  }}
                  placeholder="Cari judul kursus atau nama pengajar..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'published', 'draft'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setPublishFilter(st);
                      setCoursePage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      publishFilter === st
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    {st === 'all' ? 'Semua Status' : st === 'published' ? 'Terbit' : 'Draft'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat);
                    setCoursePage(1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#0F766E] border-[#0F766E] text-white'
                      : 'bg-[#F6F5F1] dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Stacked Cards (390px) — Courses */}
          <div className="md:hidden divide-y divide-[#E5E3DC] dark:divide-slate-800">
            {pagedCourses.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#71717A]">
                Tidak ada kursus yang sesuai dengan filter.
              </div>
            ) : (
              pagedCourses.map((c) => (
                <div key={c.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#18181B] dark:text-white line-clamp-2">
                        {c.title}
                      </p>
                      <p className="text-xs text-[#71717A] dark:text-slate-400">
                        {c.category} • Pengajar: {c.teacher_name ?? 'Pengajar'}
                      </p>
                    </div>
                    <Badge tone={c.is_published ? 'emerald' : 'amber'}>
                      {c.is_published ? 'Terbit' : 'Draft'}
                    </Badge>
                  </div>
                  <Button
                    variant={c.is_published ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full"
                    disabled={togglePublishMut.isPending}
                    onClick={() =>
                      togglePublishMut.mutate({ courseId: c.id, isPublished: !c.is_published })
                    }
                  >
                    {c.is_published ? 'Tarik ke Draft' : 'Terbitkan'}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6F5F1] dark:bg-slate-900 border-b border-[#E5E3DC] dark:border-slate-800 text-xs font-semibold text-[#71717A] dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Kursus</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                {pagedCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[#18181B] dark:text-white">{c.title}</p>
                      <p className="text-xs text-[#71717A] dark:text-slate-400">
                        {c.teacher_name ?? 'Pengajar'} • {c.level}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-[#52525B] dark:text-slate-300">{c.category}</td>
                    <td className="px-6 py-3.5">
                      <Badge tone={c.is_published ? 'emerald' : 'amber'}>
                        {c.is_published ? 'Terbit' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        variant={c.is_published ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() =>
                          togglePublishMut.mutate({
                            courseId: c.id,
                            isPublished: !c.is_published,
                          })
                        }
                      >
                        {c.is_published ? 'Tarik ke Draft' : 'Terbitkan'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalCoursePages > 1 && (
            <div className="px-6 py-3.5 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[#71717A] dark:text-slate-400">
                Menampilkan {pagedCourses.length} dari {filteredCourses.length} kursus (Hal{' '}
                {safeCoursePage}/{totalCoursePages})
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safeCoursePage <= 1}
                  onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safeCoursePage >= totalCoursePages}
                  onClick={() => setCoursePage((p) => Math.min(totalCoursePages, p + 1))}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: ADMIN AUDIT LOG */}
      {activeTab === 'audit' && (
        <AdminAuditLogPanel
          logs={auditLogs}
          onExportCsv={(filteredLogs) =>
            downloadCsvFile(
              `lokatalenta-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
              buildAuditLogsCsv(filteredLogs)
            )
          }
        />
      )}
    </div>
  );
}
