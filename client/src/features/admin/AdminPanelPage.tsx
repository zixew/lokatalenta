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
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  Megaphone,
  MessageSquare,
  Search,
  Shield,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { lmsApi } from '../../shared/services/lmsApi';
import type { Course, Profile, UserRole } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
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
import {
  type BroadcastSeverity,
  type BroadcastTargetRole,
  createSystemBroadcast,
  listAllBroadcasts,
  toggleSystemBroadcast,
} from './systemBroadcast';

type AdminTab =
  | 'users'
  | 'courses'
  | 'cohorts'
  | 'community'
  | 'certificates'
  | 'broadcasts'
  | 'audit'
  | 'health';

interface AdminCohortItem {
  id: string;
  name: string;
  invite_code: string;
  teacher_id: string;
  teacher_name: string;
  course_id: string | null;
  course_title: string;
  max_members: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

const VALID_ADMIN_TABS: readonly AdminTab[] = [
  'users',
  'courses',
  'cohorts',
  'community',
  'certificates',
  'broadcasts',
  'audit',
  'health',
];

const USER_PAGE_SIZE = 10;
const COURSE_PAGE_SIZE = 10;
const COMMUNITY_PAGE_SIZE = 10;
const CERT_PAGE_SIZE = 10;

export function AdminPanelPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as AdminTab | null;
  const activeTab: AdminTab =
    tabParam && VALID_ADMIN_TABS.includes(tabParam) ? tabParam : 'users';

  const setActiveTab = (tab: AdminTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  const [drawerTarget, setDrawerTarget] = useState<
    { type: 'user'; user: Profile } | { type: 'course'; course: Course } | null
  >(null);

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

  // Community moderation filters & pagination
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState('Semua');
  const [communityPage, setCommunityPage] = useState(1);
  const [previewPost, setPreviewPost] = useState<{
    id: string;
    title: string;
    content: string;
    category: string;
    author_name: string;
    author_role: UserRole;
    created_at: string;
  } | null>(null);

  // Certificate filters, pagination & revoke modal
  const [certSearch, setCertSearch] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');
  const [certPage, setCertPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<CertificateWithRevocation | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Cohort supervision filters
  const [cohortSearch, setCohortSearch] = useState('');
  const [cohortStatusFilter, setCohortStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Global broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<BroadcastSeverity>('info');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<BroadcastTargetRole>('all');

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

  const { data: allCohorts = [], isLoading: isCohortsLoading } = useQuery<AdminCohortItem[]>({
    queryKey: ['admin-all-cohorts', profiles.length, courses.length],
    queryFn: async () => {
      const profileNameMap = new Map(profiles.map((p) => [p.id, p.full_name]));
      const courseTitleMap = new Map(courses.map((c) => [c.id, c.title]));

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('cohorts')
            .select('id, teacher_id, course_id, name, invite_code, max_members, is_active, created_at, cohort_members(count)')
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map((row: Record<string, unknown>) => {
              const teacherId = String(row.teacher_id);
              const courseId = row.course_id ? String(row.course_id) : null;
              const membersArr = Array.isArray(row.cohort_members)
                ? (row.cohort_members as Array<{ count?: number }>)
                : [];
              return {
                id: String(row.id),
                name: String(row.name),
                invite_code: String(row.invite_code),
                teacher_id: teacherId,
                teacher_name: profileNameMap.get(teacherId) ?? 'Mentor',
                course_id: courseId,
                course_title: courseId ? (courseTitleMap.get(courseId) ?? 'Kursus') : 'Semua Kursus',
                max_members: Number(row.max_members) || 30,
                member_count: Number(membersArr[0]?.count ?? 0),
                is_active: row.is_active !== false,
                created_at: String(row.created_at),
              };
            });
          }
        } catch {
          // fall through to local fallback
        }
      }

      try {
        const rawCohorts = localStorage.getItem('lokatalenta_cohorts_v1');
        const rawMembers = localStorage.getItem('lokatalenta_cohort_members_v1');
        const localCohorts = rawCohorts ? (JSON.parse(rawCohorts) as Array<Record<string, unknown>>) : [];
        const localMembers = rawMembers ? (JSON.parse(rawMembers) as Array<{ cohort_id: string }>) : [];
        return localCohorts.map((row) => {
          const id = String(row.id);
          const teacherId = String(row.teacher_id);
          const courseId = row.course_id ? String(row.course_id) : null;
          return {
            id,
            name: String(row.name),
            invite_code: String(row.invite_code),
            teacher_id: teacherId,
            teacher_name: profileNameMap.get(teacherId) ?? 'Mentor',
            course_id: courseId,
            course_title: courseId
              ? (courseTitleMap.get(courseId) ?? String(row.course_title ?? 'Kursus'))
              : 'Semua Kursus',
            max_members: Number(row.max_members) || 30,
            member_count: localMembers.filter((m) => m.cohort_id === id).length,
            is_active: row.is_active !== false,
            created_at: String(row.created_at ?? new Date().toISOString()),
          };
        });
      } catch {
        return [];
      }
    },
  });

  const toggleCohortActiveMut = useMutation({
    mutationFn: async ({ cohortId, isActive }: { cohortId: string; isActive: boolean }) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('cohorts')
          .update({ is_active: isActive })
          .eq('id', cohortId);
        if (error) throw new Error(error.message);
        return;
      }
      const rawCohorts = localStorage.getItem('lokatalenta_cohorts_v1');
      const localCohorts = rawCohorts ? (JSON.parse(rawCohorts) as Array<Record<string, unknown>>) : [];
      const next = localCohorts.map((c) => (String(c.id) === cohortId ? { ...c, is_active: isActive } : c));
      localStorage.setItem('lokatalenta_cohorts_v1', JSON.stringify(next));
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-cohorts'] });
      showFeedback('success', vars.isActive ? 'Cohort diaktifkan kembali.' : 'Cohort diarsipkan.');
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal mengubah status cohort.');
    },
  });

  const { data: allBroadcasts = [], isLoading: isBroadcastsLoading } = useQuery({
    queryKey: ['system-broadcasts-all'],
    queryFn: listAllBroadcasts,
  });

  const createBroadcastMut = useMutation({
    mutationFn: () =>
      createSystemBroadcast({
        title: broadcastTitle,
        message: broadcastMessage,
        severity: broadcastSeverity,
        target_role: broadcastTargetRole,
        created_by: currentUser?.id ?? null,
      }),
    onSuccess: () => {
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastSeverity('info');
      setBroadcastTargetRole('all');
      queryClient.invalidateQueries({ queryKey: ['system-broadcasts-all'] });
      queryClient.invalidateQueries({ queryKey: ['system-broadcasts-active'] });
      showFeedback('success', 'Pengumuman global berhasil diterbitkan.');
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal menerbitkan pengumuman global.');
    },
  });

  const toggleBroadcastMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleSystemBroadcast(id, isActive),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['system-broadcasts-all'] });
      queryClient.invalidateQueries({ queryKey: ['system-broadcasts-active'] });
      showFeedback('success', vars.isActive ? 'Pengumuman diaktifkan.' : 'Pengumuman dinonaktifkan.');
    },
    onError: (err: Error) => {
      showFeedback('error', err.message || 'Gagal memperbarui status pengumuman.');
    },
  });

  const filteredCohorts = useMemo(() => {
    const q = cohortSearch.trim().toLowerCase();
    return allCohorts.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.teacher_name.toLowerCase().includes(q) ||
        c.course_title.toLowerCase().includes(q) ||
        c.invite_code.toLowerCase().includes(q);
      const matchStatus =
        cohortStatusFilter === 'all' ||
        (cohortStatusFilter === 'active' && c.is_active) ||
        (cohortStatusFilter === 'archived' && !c.is_active);
      return matchSearch && matchStatus;
    });
  }, [allCohorts, cohortSearch, cohortStatusFilter]);

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
    if (role === 'admin') {
      setConfirmState({
        title: 'Promosikan menjadi Admin?',
        description: `Pengguna ${target?.full_name || target?.email || 'ini'} akan mendapatkan akses penuh Admin Panel.`,
        confirmLabel: 'Promosikan',
        tone: 'primary',
        onConfirm: () => updateRoleMut.mutate({ userId, role }),
      });
      return;
    }
    updateRoleMut.mutate({ userId, role });
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    const target = profiles.find((p) => p.id === userId);
    if (!isActive) {
      setConfirmState({
        title: 'Nonaktifkan Akun Pengguna?',
        description: `Akun ${target?.full_name || target?.email || 'pengguna'} tidak akan bisa masuk sampai diaktifkan kembali.`,
        confirmLabel: 'Nonaktifkan',
        tone: 'danger',
        onConfirm: () => toggleActiveMut.mutate({ userId, isActive }),
      });
      return;
    }
    toggleActiveMut.mutate({ userId, isActive });
  };

  const handleTogglePublish = (courseId: string, isPublished: boolean) => {
    const target = courses.find((c) => c.id === courseId);
    if (!isPublished) {
      setConfirmState({
        title: 'Tarik Kursus ke Draft?',
        description: `Kursus "${target?.title || ''}" akan disembunyikan dari katalog publik pelajar.`,
        confirmLabel: 'Tarik ke Draft',
        tone: 'danger',
        onConfirm: () => togglePublishMut.mutate({ courseId, isPublished }),
      });
      return;
    }
    togglePublishMut.mutate({ courseId, isPublished });
  };

  const handleDeleteCommunityPost = (postId: string, title: string) => {
    setConfirmState({
      title: 'Hapus Postingan Komunitas?',
      description: `Postingan "${title}" akan dihapus secara permanen dari forum komunitas.`,
      confirmLabel: 'Hapus Permanen',
      tone: 'danger',
      onConfirm: () => deleteCommunityPostMut.mutate(postId),
    });
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

  const totalCommunityPages = Math.max(
    1,
    Math.ceil(filteredCommunityPosts.length / COMMUNITY_PAGE_SIZE)
  );
  const safeCommunityPage = Math.min(communityPage, totalCommunityPages);
  const pagedCommunityPosts = filteredCommunityPosts.slice(
    (safeCommunityPage - 1) * COMMUNITY_PAGE_SIZE,
    safeCommunityPage * COMMUNITY_PAGE_SIZE
  );

  const totalCertPages = Math.max(1, Math.ceil(filteredCertificates.length / CERT_PAGE_SIZE));
  const safeCertPage = Math.min(certPage, totalCertPages);
  const pagedCertificates = filteredCertificates.slice(
    (safeCertPage - 1) * CERT_PAGE_SIZE,
    safeCertPage * CERT_PAGE_SIZE
  );

  const courseDistribution = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.is_published).length;
    const draft = total - published;
    return { total, published, draft };
  }, [courses]);

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

      {/* Pure-SVG Grafik Distribusi Role & Status Kursus (BL-40D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-5">
          {(() => {
            const total = Math.max(1, userDistribution.total);
            const r = 28;
            const c = 2 * Math.PI * r;
            const studentLen = (userDistribution.student / total) * c;
            const teacherLen = (userDistribution.teacher / total) * c;
            const adminLen = (userDistribution.admin / total) * c;
            return (
              <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0 -rotate-90" aria-label="Grafik distribusi role pengguna">
                <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-[#E5E3DC] dark:text-slate-800" />
                {userDistribution.total > 0 && (
                  <>
                    <circle
                      cx="38"
                      cy="38"
                      r={r}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="10"
                      strokeDasharray={`${studentLen} ${c}`}
                      strokeDashoffset={0}
                    />
                    <circle
                      cx="38"
                      cy="38"
                      r={r}
                      fill="none"
                      stroke="#0EA5E9"
                      strokeWidth="10"
                      strokeDasharray={`${teacherLen} ${c}`}
                      strokeDashoffset={-studentLen}
                    />
                    <circle
                      cx="38"
                      cy="38"
                      r={r}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="10"
                      strokeDasharray={`${adminLen} ${c}`}
                      strokeDashoffset={-(studentLen + teacherLen)}
                    />
                  </>
                )}
              </svg>
            );
          })()}
          <div className="space-y-1.5 min-w-0 flex-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
              Grafik Distribusi Role
            </h2>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono-tabular">
              <div>
                <span className="inline-flex items-center gap-1 text-[#71717A] dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Pelajar
                </span>
                <p className="font-bold text-[#18181B] dark:text-white">{userDistribution.student}</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[#71717A] dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Pengajar
                </span>
                <p className="font-bold text-[#18181B] dark:text-white">{userDistribution.teacher}</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[#71717A] dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Admin
                </span>
                <p className="font-bold text-[#18181B] dark:text-white">{userDistribution.admin}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-5">
          {(() => {
            const total = Math.max(1, courseDistribution.total);
            const r = 28;
            const c = 2 * Math.PI * r;
            const pubLen = (courseDistribution.published / total) * c;
            const draftLen = (courseDistribution.draft / total) * c;
            return (
              <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0 -rotate-90" aria-label="Grafik status publikasi kursus">
                <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-[#E5E3DC] dark:text-slate-800" />
                {courseDistribution.total > 0 && (
                  <>
                    <circle
                      cx="38"
                      cy="38"
                      r={r}
                      fill="none"
                      stroke="#0F766E"
                      strokeWidth="10"
                      strokeDasharray={`${pubLen} ${c}`}
                      strokeDashoffset={0}
                    />
                    <circle
                      cx="38"
                      cy="38"
                      r={r}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="10"
                      strokeDasharray={`${draftLen} ${c}`}
                      strokeDashoffset={-pubLen}
                    />
                  </>
                )}
              </svg>
            );
          })()}
          <div className="space-y-1.5 min-w-0 flex-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
              Status Publikasi Kursus
            </h2>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono-tabular">
              <div>
                <span className="inline-flex items-center gap-1 text-[#71717A] dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                  Terbit
                </span>
                <p className="font-bold text-[#18181B] dark:text-white">{courseDistribution.published}</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[#71717A] dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Draft
                </span>
                <p className="font-bold text-[#18181B] dark:text-white">{courseDistribution.draft}</p>
              </div>
              <div>
                <span className="text-[#71717A] dark:text-slate-400">Total</span>
                <p className="font-bold text-[#18181B] dark:text-white">{courseDistribution.total}</p>
              </div>
            </div>
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
      <div className="flex flex-nowrap md:flex-wrap overflow-x-auto gap-2 border-b border-[#E5E3DC] dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
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
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
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
          onClick={() => setActiveTab('cohorts')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'cohorts'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Supervisi Cohort ({allCohorts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('community')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
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
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
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
          onClick={() => setActiveTab('broadcasts')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'broadcasts'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Pengumuman Global ({allBroadcasts.filter((b) => b.is_active).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
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
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
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
                {(['all', 'student', 'teacher', 'recruiter', 'admin'] as const).map((r) => (
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
                      : r === 'recruiter'
                      ? 'Rekruter'
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
                        {p.role === 'student' ? 'Pelajar' : p.role === 'teacher' ? 'Pengajar' : p.role === 'recruiter' ? 'Rekruter' : 'Admin'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['student', 'teacher', 'recruiter', 'admin'] as UserRole[]).map((role) => (
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
                          {role === 'student' ? 'Pelajar' : role === 'teacher' ? 'Pengajar' : role === 'recruiter' ? 'Rekruter' : 'Admin'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDrawerTarget({ type: 'user', user: p })}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </Button>
                      <Button
                        variant={p.is_active === false ? 'primary' : 'danger'}
                        size="sm"
                        className="flex-1"
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
                            p.role === 'admin' ? 'amber' : p.role === 'teacher' ? 'blue' : p.role === 'recruiter' ? 'rose' : 'emerald'
                          }
                        >
                          {p.role === 'student'
                            ? 'Pelajar'
                            : p.role === 'teacher'
                            ? 'Pengajar'
                            : p.role === 'recruiter'
                            ? 'Rekruter'
                            : 'Admin'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="inline-flex rounded-lg border border-[#E5E3DC] dark:border-slate-700 overflow-hidden">
                          {(['student', 'teacher', 'recruiter', 'admin'] as UserRole[]).map((roleOpt) => {
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
                                  : roleOpt === 'recruiter'
                                  ? 'Rekruter'
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
                            <div className="inline-flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDrawerTarget({ type: 'user', user: p })}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Detail
                              </Button>
                              <Button
                                variant={p.is_active === false ? 'primary' : 'danger'}
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
                            </div>
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
                  Sebelumnya
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safeUserPage >= totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                >
                  Berikutnya
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
                      onClick={() => setDrawerTarget({ type: 'course', course: c })}
                    >
                      Detail
                    </Button>
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
                          onClick={() => setDrawerTarget({ type: 'course', course: c })}
                        >
                          Detail
                        </Button>
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
            <div className="px-6 py-3.5 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
              <span>
                Halaman {safeCoursePage} dari {totalCoursePages} ({filteredCourses.length} kursus)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safeCoursePage <= 1}
                  onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Sebelumnya
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safeCoursePage >= totalCoursePages}
                  onClick={() => setCoursePage((p) => Math.min(totalCoursePages, p + 1))}
                >
                  Berikutnya
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
                  onChange={(e) => {
                    setCommunitySearch(e.target.value);
                    setCommunityPage(1);
                  }}
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
                  onClick={() => {
                    setCommunityCategoryFilter(cat);
                    setCommunityPage(1);
                  }}
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
            <>
              <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                {pagedCommunityPosts.map((post) => (
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
                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewPost(post)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat Lengkap
                      </Button>
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
              {totalCommunityPages > 1 && (
                <div className="px-6 py-3.5 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
                  <span>
                    Halaman {safeCommunityPage} dari {totalCommunityPages} ({filteredCommunityPosts.length} postingan)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={safeCommunityPage <= 1}
                      onClick={() => setCommunityPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={safeCommunityPage >= totalCommunityPages}
                      onClick={() => setCommunityPage((p) => Math.min(totalCommunityPages, p + 1))}
                    >
                      Berikutnya
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
                onChange={(e) => {
                  setCertSearch(e.target.value);
                  setCertPage(1);
                }}
                placeholder="Cari kode sertifikat, penerima, atau kursus..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'valid', 'revoked'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setCertStatusFilter(st);
                    setCertPage(1);
                  }}
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
                {pagedCertificates.map((cert) => {
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
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/verify/${encodeURIComponent(cert.cert_code)}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:bg-[#F6F5F1] dark:hover:bg-slate-800"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Lihat Verifikasi
                        </Link>
                        {!isRevoked && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-1"
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
                    {pagedCertificates.map((cert) => {
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
                            <div className="inline-flex items-center gap-2">
                              <Link
                                to={`/verify/${encodeURIComponent(cert.cert_code)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Lihat Verifikasi
                              </Link>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalCertPages > 1 && (
                <div className="px-6 py-3.5 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
                  <span>
                    Halaman {safeCertPage} dari {totalCertPages} ({filteredCertificates.length} sertifikat)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={safeCertPage <= 1}
                      onClick={() => setCertPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={safeCertPage >= totalCertPages}
                      onClick={() => setCertPage((p) => Math.min(totalCertPages, p + 1))}
                    >
                      Berikutnya
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* TAB: SUPERVISI COHORT */}
      {activeTab === 'cohorts' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 bg-[#FAFAF9] dark:bg-slate-900/50 border-b border-[#E5E3DC] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                Supervisi Cohort Lintas Mentor
              </h2>
              <p className="text-xs text-[#71717A] dark:text-slate-400">
                Pantau seluruh cohort kelas privat, kuota peserta, dan status keaktifan dari semua mentor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge tone="emerald">
                Aktif: {allCohorts.filter((c) => c.is_active).length}
              </Badge>
              <Badge tone="slate">
                Total Peserta: {allCohorts.reduce((acc, c) => acc + c.member_count, 0)}
              </Badge>
            </div>
          </div>

          <div className="p-4 border-b border-[#E5E3DC] dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cohortSearch}
                onChange={(e) => setCohortSearch(e.target.value)}
                placeholder="Cari nama cohort, mentor, kursus, atau kode undangan..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#18181B] dark:text-white"
              />
            </div>
            <select
              value={cohortStatusFilter}
              onChange={(e) => setCohortStatusFilter(e.target.value as 'all' | 'active' | 'archived')}
              aria-label="Filter status cohort"
              className="px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#18181B] dark:text-white"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>

          {isCohortsLoading ? (
            <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
              Memuat data cohort...
            </div>
          ) : filteredCohorts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
              Belum ada cohort yang sesuai filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E5E3DC] dark:border-slate-800 text-xs uppercase text-[#71717A] dark:text-slate-400 bg-[#FAFAF9] dark:bg-slate-900/40">
                    <th className="py-3 px-4 font-semibold">Cohort</th>
                    <th className="py-3 px-4 font-semibold">Mentor</th>
                    <th className="py-3 px-4 font-semibold">Kursus</th>
                    <th className="py-3 px-4 font-semibold">Kode</th>
                    <th className="py-3 px-4 font-semibold">Peserta</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                  {filteredCohorts.map((cohort) => (
                    <tr key={cohort.id} className="hover:bg-[#FAFAF9] dark:hover:bg-slate-900/30">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#18181B] dark:text-white">{cohort.name}</p>
                        <p className="text-xs text-[#71717A] dark:text-slate-400">
                          Dibuat {new Date(cohort.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-[#52525B] dark:text-slate-300">
                        {cohort.teacher_name}
                      </td>
                      <td className="py-3 px-4 text-[#52525B] dark:text-slate-300 max-w-[200px] truncate">
                        {cohort.course_title}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#18181B] dark:text-slate-200">
                        {cohort.invite_code}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-xs text-[#18181B] dark:text-slate-200">
                        {cohort.member_count} / {cohort.max_members}
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={cohort.is_active ? 'emerald' : 'slate'}>
                          {cohort.is_active ? 'Aktif' : 'Diarsipkan'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={toggleCohortActiveMut.isPending}
                          onClick={() =>
                            toggleCohortActiveMut.mutate({
                              cohortId: cohort.id,
                              isActive: !cohort.is_active,
                            })
                          }
                        >
                          {cohort.is_active ? 'Arsipkan' : 'Aktifkan'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB: PENGUMUMAN GLOBAL */}
      {activeTab === 'broadcasts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
            <div>
              <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#0F766E]" />
                Buat Pengumuman Global
              </h2>
              <p className="text-xs text-[#71717A] dark:text-slate-400 mt-1">
                Tampilkan banner pengumuman sistem di bagian atas aplikasi untuk peran target yang dipilih.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
                createBroadcastMut.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Contoh: Pemeliharaan Terjadwal Minggu Ini"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#18181B] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                  Isi Pesan
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Tuliskan detail informasi singkat dan jelas untuk pengguna..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#18181B] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                    Target Peran
                  </label>
                  <select
                    value={broadcastTargetRole}
                    onChange={(e) => setBroadcastTargetRole(e.target.value as BroadcastTargetRole)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#18181B] dark:text-white"
                  >
                    <option value="all">Semua Pengguna</option>
                    <option value="student">Pelajar</option>
                    <option value="teacher">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value as BroadcastSeverity)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#18181B] dark:text-white"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Peringatan</option>
                    <option value="urgent">Penting / Mendesak</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  createBroadcastMut.isPending ||
                  !broadcastTitle.trim() ||
                  !broadcastMessage.trim()
                }
              >
                {createBroadcastMut.isPending ? 'Mengirim...' : 'Terbitkan Pengumuman Global'}
              </Button>
            </form>
          </section>

          <section className="lg:col-span-7 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#FAFAF9] dark:bg-slate-900/50 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B] dark:text-white">
                  Daftar Pengumuman Global
                </h3>
                <p className="text-xs text-[#71717A] dark:text-slate-400">
                  Kelola status aktif/nonaktif banner pengumuman sistem.
                </p>
              </div>
              <Badge tone="blue">{allBroadcasts.length} Total</Badge>
            </div>

            {isBroadcastsLoading ? (
              <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
                Memuat pengumuman...
              </div>
            ) : allBroadcasts.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
                Belum ada pengumuman global yang dibuat.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                {allBroadcasts.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={
                            item.severity === 'urgent'
                              ? 'rose'
                              : item.severity === 'warning'
                                ? 'amber'
                                : 'blue'
                          }
                        >
                          {item.severity === 'urgent'
                            ? 'Mendesak'
                            : item.severity === 'warning'
                              ? 'Peringatan'
                              : 'Info'}
                        </Badge>
                        <Badge tone="slate">
                          Target:{' '}
                          {item.target_role === 'all'
                            ? 'Semua'
                            : item.target_role === 'student'
                              ? 'Pelajar'
                              : item.target_role === 'teacher'
                                ? 'Mentor'
                                : 'Admin'}
                        </Badge>
                        <Badge tone={item.is_active ? 'emerald' : 'slate'}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm text-[#18181B] dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#52525B] dark:text-slate-300">
                        {item.message}
                      </p>
                      <p className="text-[11px] text-[#71717A] dark:text-slate-400">
                        Dibuat {new Date(item.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={toggleBroadcastMut.isPending}
                      onClick={() =>
                        toggleBroadcastMut.mutate({
                          id: item.id,
                          isActive: !item.is_active,
                        })
                      }
                      className="shrink-0"
                    >
                      {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
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

      {/* COMMUNITY POST FULL-CONTENT PREVIEW MODAL */}
      {previewPost && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Detail Postingan Komunitas"
        >
          <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{previewPost.category}</Badge>
                  <span className="text-xs font-semibold text-[#18181B] dark:text-slate-200">
                    {previewPost.author_name}
                  </span>
                  <span className="text-xs text-[#71717A] dark:text-slate-400 font-mono-tabular">
                    {new Date(previewPost.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                  {previewPost.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="p-1.5 rounded-lg text-[#71717A] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup pratinjau postingan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <p className="text-sm text-[#18181B] dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {previewPost.content}
              </p>
            </div>
            <div className="px-5 py-3.5 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2 bg-[#FAFAF9] dark:bg-slate-900/40">
              <Button
                variant="danger"
                size="sm"
                disabled={deleteCommunityPostMut.isPending}
                onClick={() => {
                  const target = previewPost;
                  setPreviewPost(null);
                  handleDeleteCommunityPost(target.id, target.title);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Postingan
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPreviewPost(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DETAIL DRAWER (BL-40D) */}
      {drawerTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Detail Inspeksi"
        >
          <div className="bg-white dark:bg-[#161B22] border-l border-[#E5E3DC] dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                {drawerTarget.type === 'user' ? 'Detail Pengguna' : 'Detail Kursus'}
              </h2>
              <button
                type="button"
                onClick={() => setDrawerTarget(null)}
                className="p-1.5 rounded-lg text-[#71717A] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup drawer detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
              {drawerTarget.type === 'user' ? (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          drawerTarget.user.role === 'admin'
                            ? 'amber'
                            : drawerTarget.user.role === 'teacher'
                              ? 'blue'
                              : 'emerald'
                        }
                      >
                        {drawerTarget.user.role === 'student'
                          ? 'Pelajar'
                          : drawerTarget.user.role === 'teacher'
                            ? 'Pengajar'
                            : 'Admin'}
                      </Badge>
                      <Badge tone={drawerTarget.user.is_active === false ? 'rose' : 'emerald'}>
                        {drawerTarget.user.is_active === false ? 'Nonaktif' : 'Aktif'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-[#18181B] dark:text-white">
                      {drawerTarget.user.full_name}
                    </h3>
                    <p className="text-xs text-[#71717A] dark:text-slate-400">
                      {drawerTarget.user.email}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-[#71717A] dark:text-slate-400 block">ID Pengguna</span>
                      <span className="font-mono text-[#18181B] dark:text-slate-200 break-all">
                        {drawerTarget.user.id}
                      </span>
                    </div>
                    {drawerTarget.user.bio && (
                      <div>
                        <span className="text-[#71717A] dark:text-slate-400 block">Bio</span>
                        <span className="text-[#18181B] dark:text-slate-200">
                          {drawerTarget.user.bio}
                        </span>
                      </div>
                    )}
                    {drawerTarget.user.created_at && (
                      <div>
                        <span className="text-[#71717A] dark:text-slate-400 block">Terdaftar</span>
                        <span className="font-mono-tabular text-[#18181B] dark:text-slate-200">
                          {new Date(drawerTarget.user.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {drawerTarget.user.id !== currentUser?.id && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400 block">
                        Aksi Cepat
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['student', 'teacher', 'recruiter', 'admin'] as UserRole[]).map((roleOpt) => (
                          <button
                            key={roleOpt}
                            type="button"
                            disabled={updateRoleMut.isPending}
                            onClick={() => {
                              handleRoleChange(drawerTarget.user.id, roleOpt);
                              setDrawerTarget(null);
                            }}
                            className={`py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                              drawerTarget.user.role === roleOpt
                                ? 'bg-[#0F766E] text-white'
                                : 'border border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300'
                            }`}
                          >
                            {roleOpt === 'student'
                              ? 'Pelajar'
                              : roleOpt === 'teacher'
                                ? 'Pengajar'
                                : roleOpt === 'recruiter'
                                ? 'Rekruter'
                                : 'Admin'}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant={drawerTarget.user.is_active === false ? 'primary' : 'danger'}
                        size="sm"
                        className="w-full"
                        disabled={toggleActiveMut.isPending}
                        onClick={() => {
                          handleToggleActive(
                            drawerTarget.user.id,
                            drawerTarget.user.is_active === false
                          );
                          setDrawerTarget(null);
                        }}
                      >
                        {drawerTarget.user.is_active === false ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={drawerTarget.course.is_published ? 'emerald' : 'amber'}>
                        {drawerTarget.course.is_published ? 'Terbit' : 'Draft'}
                      </Badge>
                      <Badge tone="blue">{drawerTarget.course.category}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-[#18181B] dark:text-white">
                      {drawerTarget.course.title}
                    </h3>
                    <p className="text-xs text-[#71717A] dark:text-slate-400">
                      Pengajar: {drawerTarget.course.teacher_name ?? 'Pengajar'} • Level{' '}
                      {drawerTarget.course.level} • {drawerTarget.course.estimated_hours} jam
                    </p>
                  </div>

                  <p className="text-xs text-[#52525B] dark:text-slate-300 leading-relaxed">
                    {drawerTarget.course.description}
                  </p>

                  <div className="p-3.5 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[#71717A] dark:text-slate-400 block">Slug</span>
                      <span className="font-mono text-[#18181B] dark:text-slate-200">
                        {drawerTarget.course.slug}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#71717A] dark:text-slate-400 block">Jumlah Modul</span>
                      <span className="font-mono-tabular font-semibold text-[#18181B] dark:text-slate-200">
                        {drawerTarget.course.modules?.length ?? 0} modul
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const target = drawerTarget.course;
                        setDrawerTarget(null);
                        setPreviewCourse(target);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Pratinjau Modul &amp; Pelajaran
                    </Button>
                    <Button
                      variant={drawerTarget.course.is_published ? 'danger' : 'primary'}
                      size="sm"
                      disabled={togglePublishMut.isPending}
                      onClick={() => {
                        const target = drawerTarget.course;
                        setDrawerTarget(null);
                        handleTogglePublish(target.id, !target.is_published);
                      }}
                    >
                      {drawerTarget.course.is_published ? 'Tarik ke Draft' : 'Terbitkan Kursus'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG (BL-40E) */}
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ''}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel ?? 'Konfirmasi'}
        tone={confirmState?.tone ?? 'danger'}
        onConfirm={() => {
          confirmState?.onConfirm();
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
