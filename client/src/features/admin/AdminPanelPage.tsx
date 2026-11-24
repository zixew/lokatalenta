import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Award,
  Ban,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileText,
  HelpCircle,
  MessageSquare,
  Search,
  Shield,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import type { Course, UserRole } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import {
  type CertificateWithRevocation,
  listAllCertificatesAsync,
  revokeCertificateAsync,
} from '../talent/talentApi';
import { AdminAuditLogPanel } from './AdminAuditLogPanel';
import { AdminHealthTelemetryPanel } from './AdminHealthTelemetryPanel';
import {
  recordAdminAuditLogAsync,
  syncAdminAuditLogsFromServer,
} from './adminAuditLog';
import {
  buildAuditLogsCsv,
  buildUsersCsv,
  downloadCsvFile,
} from './adminCsvExport';

type AdminTab = 'users' | 'courses' | 'community' | 'certificates' | 'audit' | 'health';
const USER_PAGE_SIZE = 10;
const COURSE_PAGE_SIZE = 10;

export function AdminPanelPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (tone: 'success' | 'error', message: string) => {
    setFeedback({ tone, message });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

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
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  // Community moderation filters
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState('Semua');

  // Certificate filters & revoke modal
  const [certSearch, setCertSearch] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');
  const [revokeTarget, setRevokeTarget] = useState<CertificateWithRevocation | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: () => lmsApi.listAllProfiles(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => lmsApi.listAllCoursesForManagement(),
  });

  const { data: previewCourseDetail, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['admin-course-preview', previewCourse?.slug],
    queryFn: () => lmsApi.getCourseBySlug(previewCourse!.slug),
    enabled: Boolean(previewCourse?.slug),
  });

  const { data: communityPosts = [], isLoading: isCommunityLoading } = useQuery({
    queryKey: ['admin-community-posts'],
    queryFn: () => lmsApi.listCommunityPosts(),
  });

  const { data: certificates = [], isLoading: isCertsLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: () => listAllCertificatesAsync(),
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
      showFeedback('success', `Role ${targetUser?.full_name || targetUser?.email || 'pengguna'} diubah menjadi ${vars.role}.`);
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal memperbarui role pengguna.');
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
      showFeedback('success', vars.isPublished ? 'Kursus berhasil diterbitkan.' : 'Kursus ditarik ke Draft.');
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal memperbarui status publikasi kursus.');
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
      showFeedback('success', vars.isActive ? 'Akun berhasil diaktifkan.' : 'Akun berhasil dinonaktifkan.');
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal memperbarui status akun.');
    },
  });

  const deleteCommunityPostMut = useMutation({
    mutationFn: (postId: string) => lmsApi.deleteCommunityPost(postId),
    onSuccess: async (_data, postId) => {
      const targetPost = communityPosts.find((p) => p.id === postId);
      queryClient.invalidateQueries({ queryKey: ['admin-community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      const updated = await recordAdminAuditLogAsync({
        actorId: currentUser?.id,
        actorName: currentUser?.full_name || 'Admin',
        action: 'COMMUNITY_POST_DELETED',
        targetLabel: targetPost?.title || postId,
        detail: `Menghapus postingan komunitas oleh ${targetPost?.author_name || 'Pengguna'} (${targetPost?.category || 'Umum'})`,
      });
      queryClient.setQueryData(['admin-audit-logs'], updated);
      showFeedback('success', 'Postingan komunitas berhasil dihapus.');
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal menghapus postingan komunitas.');
    },
  });

  const revokeCertMut = useMutation({
    mutationFn: ({ certId, reason }: { certId: string; reason: string }) =>
      revokeCertificateAsync(certId, reason),
    onSuccess: async (updatedCert, vars) => {
      const targetCert = updatedCert ?? certificates.find((c) => c.id === vars.certId);
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['verify-certificate'] });
      const updated = await recordAdminAuditLogAsync({
        actorId: currentUser?.id,
        actorName: currentUser?.full_name || 'Admin',
        action: 'CERTIFICATE_REVOKED',
        targetLabel: targetCert?.cert_code || vars.certId,
        detail: `Mencabut sertifikat ${targetCert?.student_name || ''} (${targetCert?.course_title || ''}) — Alasan: ${vars.reason.trim()}`,
      });
      queryClient.setQueryData(['admin-audit-logs'], updated);
      setRevokeTarget(null);
      setRevokeReason('');
      showFeedback('success', `Sertifikat ${targetCert?.cert_code || ''} berhasil dicabut.`);
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal mencabut sertifikat.');
    },
  });

  const handleRoleChange = (userId: string, role: UserRole) => {
    const target = profiles.find((p) => p.id === userId);
    if (target?.role === role) return;
    if (
      role === 'admin' &&
      !window.confirm(`Promosikan ${target?.full_name || target?.email || 'pengguna'} menjadi Admin?`)
    ) {
      return;
    }
    updateRoleMut.mutate({ userId, role });
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    const target = profiles.find((p) => p.id === userId);
    if (
      !isActive &&
      !window.confirm(`Nonaktifkan akun ${target?.full_name || target?.email || 'pengguna'}?`)
    ) {
      return;
    }
    toggleActiveMut.mutate({ userId, isActive });
  };

  const handleTogglePublish = (courseId: string, isPublished: boolean) => {
    const target = courses.find((c) => c.id === courseId);
    if (
      !isPublished &&
      !window.confirm(`Tarik kursus "${target?.title || ''}" dari katalog ke Draft?`)
    ) {
      return;
    }
    togglePublishMut.mutate({ courseId, isPublished });
  };

  const handleDeleteCommunityPost = (postId: string, title: string) => {
    if (!window.confirm(`Hapus postingan "${title}" secara permanen?`)) {
      return;
    }
    deleteCommunityPostMut.mutate(postId);
  };

  const userDistribution = useMemo(() => {
    const total = profiles.length;
    const student = profiles.filter((p) => p.role === 'student').length;
    const teacher = profiles.filter((p) => p.role === 'teacher').length;
    const admin = profiles.filter((p) => p.role === 'admin').length;
    const active = profiles.filter((p) => p.is_active !== false).length;
    const inactive = profiles.filter((p) => p.is_active === false).length;
    return { total, student, teacher, admin, active, inactive };
  }, [profiles]);

  const communityCategories = useMemo(
    () => ['Semua', ...Array.from(new Set(communityPosts.map((p) => p.category)))],
    [communityPosts]
  );

  const filteredCommunityPosts = useMemo(() => {
    const q = communitySearch.trim().toLowerCase();
    return communityPosts.filter((p) => {
      if (communityCategoryFilter !== 'Semua' && p.category !== communityCategoryFilter) {
        return false;
      }
      if (
        q &&
        !`${p.title} ${p.content} ${p.author_name} ${p.category}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [communityPosts, communitySearch, communityCategoryFilter]);

  const filteredCertificates = useMemo(() => {
    const q = certSearch.trim().toLowerCase();
    return certificates.filter((c) => {
      const isRevoked = Boolean(c.revoked_at);
      if (certStatusFilter === 'valid' && isRevoked) return false;
      if (certStatusFilter === 'revoked' && !isRevoked) return false;
      if (
        q &&
        !`${c.cert_code} ${c.student_name} ${c.course_title} ${c.teacher_name}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [certificates, certSearch, certStatusFilter]);

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

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl border text-sm font-medium ${
            feedback.tone === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

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
          onClick={() => setActiveTab('community')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'community'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Moderasi Komunitas ({communityPosts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'certificates'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Award className="w-4 h-4" />
          Sertifikat ({certificates.length})
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
        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'health'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          Kesehatan Sistem
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
          {/* Role & Status Distribution Summary Bar */}
          <div className="px-4 sm:px-5 py-3.5 bg-[#FAFAF9] dark:bg-slate-900/50 border-b border-[#E5E3DC] dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#52525B] dark:text-slate-300">
                  Distribusi Role
                </span>
                <div className="flex flex-wrap items-center gap-3 font-mono-tabular">
                  <span className="inline-flex items-center gap-1.5 text-[#18181B] dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Pelajar: <strong>{userDistribution.student}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#18181B] dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Pengajar: <strong>{userDistribution.teacher}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#18181B] dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Admin: <strong>{userDistribution.admin}</strong>
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#E5E3DC] dark:bg-slate-800 overflow-hidden flex">
                {userDistribution.total > 0 && (
                  <>
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(userDistribution.student / userDistribution.total) * 100}%` }}
                    />
                    <div
                      className="bg-sky-500 h-full transition-all"
                      style={{ width: `${(userDistribution.teacher / userDistribution.total) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${(userDistribution.admin / userDistribution.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#52525B] dark:text-slate-300">
                  Status Akun
                </span>
                <div className="flex flex-wrap items-center gap-3 font-mono-tabular">
                  <span className="inline-flex items-center gap-1.5 text-[#18181B] dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                    Aktif: <strong>{userDistribution.active}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#18181B] dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Nonaktif: <strong>{userDistribution.inactive}</strong>
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#E5E3DC] dark:bg-slate-800 overflow-hidden flex">
                {userDistribution.total > 0 && (
                  <>
                    <div
                      className="bg-[#0F766E] h-full transition-all"
                      style={{ width: `${(userDistribution.active / userDistribution.total) * 100}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${(userDistribution.inactive / userDistribution.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

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
                          onClick={() => handleRoleChange(p.id, role)}
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
                        handleToggleActive(p.id, p.is_active === false)
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
                                  handleRoleChange(p.id, roleOpt)
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
                                handleToggleActive(p.id, p.is_active === false)
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewCourse(c)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Pratinjau
                    </Button>
                    <Button
                      variant={c.is_published ? 'secondary' : 'primary'}
                      size="sm"
                      className="flex-1"
                      disabled={togglePublishMut.isPending}
                      onClick={() =>
                        handleTogglePublish(c.id, !c.is_published)
                      }
                    >
                      {c.is_published ? 'Tarik ke Draft' : 'Terbitkan'}
                    </Button>
                  </div>
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
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewCourse(c)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Pratinjau
                        </Button>
                        <Button
                          variant={c.is_published ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() =>
                            handleTogglePublish(c.id, !c.is_published)
                          }
                        >
                          {c.is_published ? 'Tarik ke Draft' : 'Terbitkan'}
                        </Button>
                      </div>
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

      {/* TAB: COMMUNITY MODERATION */}
      {activeTab === 'community' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5E3DC] dark:border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  placeholder="Cari judul, isi, atau penulis postingan..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <Badge tone="slate">{filteredCommunityPosts.length} Postingan</Badge>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {communityCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCommunityCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                    communityCategoryFilter === cat
                      ? 'bg-[#0F766E] border-[#0F766E] text-white'
                      : 'bg-[#F6F5F1] dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isCommunityLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-20 rounded-xl bg-[#F6F5F1] dark:bg-slate-800 animate-pulse" />
              <div className="h-20 rounded-xl bg-[#F6F5F1] dark:bg-slate-800 animate-pulse" />
            </div>
          ) : filteredCommunityPosts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
              Tidak ada postingan komunitas yang sesuai dengan filter.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
              {filteredCommunityPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{post.category}</Badge>
                      <span className="text-xs font-semibold text-[#18181B] dark:text-slate-200">
                        {post.author_name}
                      </span>
                      <Badge
                        tone={
                          post.author_role === 'admin'
                            ? 'amber'
                            : post.author_role === 'teacher'
                              ? 'blue'
                              : 'emerald'
                        }
                      >
                        {post.author_role === 'student'
                          ? 'Pelajar'
                          : post.author_role === 'teacher'
                            ? 'Pengajar'
                            : 'Admin'}
                      </Badge>
                      <span className="text-xs text-[#71717A] dark:text-slate-400 font-mono-tabular">
                        {new Date(post.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#18181B] dark:text-white">
                      {post.title}
                    </h3>
                    <p className="text-xs text-[#52525B] dark:text-slate-300 line-clamp-2">
                      {post.content}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleteCommunityPostMut.isPending}
                      onClick={() => handleDeleteCommunityPost(post.id, post.title)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: CERTIFICATES MANAGEMENT */}
      {activeTab === 'certificates' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5E3DC] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                placeholder="Cari kode sertifikat, penerima, atau kursus..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'valid', 'revoked'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCertStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    certStatusFilter === st
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                  }`}
                >
                  {st === 'all' ? 'Semua Status' : st === 'valid' ? 'Aktif' : 'Dicabut'}
                </button>
              ))}
            </div>
          </div>

          {isCertsLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-16 rounded-xl bg-[#F6F5F1] dark:bg-slate-800 animate-pulse" />
              <div className="h-16 rounded-xl bg-[#F6F5F1] dark:bg-slate-800 animate-pulse" />
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
              Belum ada sertifikat yang sesuai dengan filter.
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-[#E5E3DC] dark:divide-slate-800">
                {filteredCertificates.map((cert) => {
                  const isRevoked = Boolean(cert.revoked_at);
                  return (
                    <div key={cert.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono-tabular text-xs font-bold text-[#0F766E] dark:text-teal-400">
                            {cert.cert_code}
                          </p>
                          <p className="font-semibold text-sm text-[#18181B] dark:text-white truncate">
                            {cert.student_name}
                          </p>
                          <p className="text-xs text-[#71717A] dark:text-slate-400 truncate">
                            {cert.course_title}
                          </p>
                        </div>
                        <Badge tone={isRevoked ? 'rose' : 'emerald'}>
                          {isRevoked ? 'Dicabut' : 'Aktif'}
                        </Badge>
                      </div>
                      {isRevoked && cert.revoke_reason && (
                        <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 rounded-lg">
                          Alasan: {cert.revoke_reason}
                        </p>
                      )}
                      {!isRevoked && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setRevokeTarget(cert);
                            setRevokeReason('');
                          }}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Cabut Sertifikat
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F6F5F1] dark:bg-slate-900 border-b border-[#E5E3DC] dark:border-slate-800 text-xs font-semibold text-[#71717A] dark:text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-3">Kode Sertifikat</th>
                      <th className="px-6 py-3">Penerima &amp; Kursus</th>
                      <th className="px-6 py-3">Terbit</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                    {filteredCertificates.map((cert) => {
                      const isRevoked = Boolean(cert.revoked_at);
                      return (
                        <tr key={cert.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-3.5 font-mono-tabular text-xs font-bold text-[#18181B] dark:text-white">
                            {cert.cert_code}
                          </td>
                          <td className="px-6 py-3.5">
                            <p className="font-semibold text-[#18181B] dark:text-white">
                              {cert.student_name}
                            </p>
                            <p className="text-xs text-[#71717A] dark:text-slate-400">
                              {cert.course_title} • {cert.teacher_name}
                            </p>
                            {isRevoked && cert.revoke_reason && (
                              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                                Alasan dicabut: {cert.revoke_reason}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-[#52525B] dark:text-slate-300 font-mono-tabular">
                            {new Date(cert.issued_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge tone={isRevoked ? 'rose' : 'emerald'}>
                              {isRevoked ? 'Dicabut' : 'Aktif'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {isRevoked ? (
                              <span className="text-xs text-[#71717A] dark:text-slate-400">
                                Sudah Dicabut
                              </span>
                            ) : (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setRevokeTarget(cert);
                                  setRevokeReason('');
                                }}
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Cabut
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
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

      {/* TAB 4: SYSTEM HEALTH TELEMETRY (BL-38) */}
      {activeTab === 'health' && <AdminHealthTelemetryPanel />}

      {/* READ-ONLY COURSE PREVIEW MODAL */}
      {previewCourse && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau Kursus"
        >
          <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">Mode Pratinjau (Hanya Baca)</Badge>
                  <Badge tone={previewCourse.is_published ? 'emerald' : 'amber'}>
                    {previewCourse.is_published ? 'Terbit' : 'Draft'}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-[#18181B] dark:text-white truncate">
                  {previewCourse.title}
                </h2>
                <p className="text-xs text-[#71717A] dark:text-slate-400">
                  {previewCourse.category} • {previewCourse.level} • Pengajar:{' '}
                  {previewCourse.teacher_name ?? 'Pengajar'} • {previewCourse.estimated_hours} jam
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCourse(null)}
                className="p-1.5 rounded-lg text-[#71717A] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm text-[#52525B] dark:text-slate-300">
                {previewCourse.description}
              </p>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
                  Struktur Modul &amp; Pelajaran
                </h3>

                {isPreviewLoading ? (
                  <div className="space-y-2">
                    <div className="h-16 rounded-xl bg-[#F6F5F1] dark:bg-slate-800 animate-pulse" />
                    <div className="h-16 rounded-xl bg-[#F6F5F1] dark:bg-slate-800 animate-pulse" />
                  </div>
                ) : (previewCourseDetail?.modules ?? previewCourse.modules ?? []).length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 text-xs text-[#71717A] dark:text-slate-400 text-center">
                    Kursus ini belum memiliki modul atau pelajaran.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(previewCourseDetail?.modules ?? previewCourse.modules ?? []).map(
                      (mod, mIdx) => (
                        <div
                          key={mod.id}
                          className="border border-[#E5E3DC] dark:border-slate-800 rounded-xl overflow-hidden"
                        >
                          <div className="px-4 py-2.5 bg-[#F6F5F1] dark:bg-slate-900/70 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#18181B] dark:text-white">
                              Modul {mIdx + 1}: {mod.title}
                            </span>
                            <span className="text-xs text-[#71717A] dark:text-slate-400 font-mono-tabular">
                              {mod.lessons.length} pelajaran
                            </span>
                          </div>
                          {mod.lessons.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-[#71717A] dark:text-slate-400">
                              Belum ada pelajaran di modul ini.
                            </div>
                          ) : (
                            <ul className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                              {mod.lessons.map((lesson, lIdx) => (
                                <li
                                  key={lesson.id}
                                  className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {lesson.type === 'video' ? (
                                      <Video className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                    ) : lesson.type === 'quiz' ? (
                                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                                    )}
                                    <span className="text-[#18181B] dark:text-slate-200 truncate">
                                      {lIdx + 1}. {lesson.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 text-[#71717A] dark:text-slate-400">
                                    <Badge tone="slate">
                                      {lesson.type === 'video'
                                        ? 'Video'
                                        : lesson.type === 'quiz'
                                          ? 'Kuis'
                                          : 'Artikel'}
                                    </Badge>
                                    <span className="inline-flex items-center gap-1 font-mono-tabular">
                                      <Clock className="w-3 h-3" />
                                      {lesson.duration_minutes}m
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-end gap-2 bg-[#FAFAF9] dark:bg-slate-900/40">
              <Button variant="secondary" size="sm" onClick={() => setPreviewCourse(null)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE CERTIFICATE MODAL */}
      {revokeTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Cabut Sertifikat"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!revokeReason.trim()) return;
              revokeCertMut.mutate({ certId: revokeTarget.id, reason: revokeReason });
            }}
            className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                  Cabut Sertifikat
                </h2>
                <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5 font-mono-tabular">
                  {revokeTarget.cert_code} — {revokeTarget.student_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="p-1 rounded-lg text-[#71717A] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="revoke-reason-input"
                className="block text-xs font-semibold text-[#52525B] dark:text-slate-300"
              >
                Alasan Pencabutan (ditampilkan di halaman verifikasi)
              </label>
              <textarea
                id="revoke-reason-input"
                rows={3}
                required
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Contoh: Ditemukan pelanggaran integritas ujian atau kesalahan penerbitan data..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRevokeTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={revokeCertMut.isPending || !revokeReason.trim()}
              >
                <Ban className="w-3.5 h-3.5" />
                {revokeCertMut.isPending ? 'Mencabut...' : 'Konfirmasi Cabut'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
