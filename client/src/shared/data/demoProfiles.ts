import type { Profile } from '../types/lms';

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-student-1',
    full_name: 'Nadia Kusuma',
    email: 'nadia@pelajar.id',
    role: 'student',
    bio: 'Sedang mempersiapkan diri mengikuti seleksi pegawai perusahaan ritel nasional dan korporasi besar.',
    is_active: true,
  },
  {
    id: 'demo-teacher-1',
    full_name: 'Rizco Renova',
    email: 'rizco@pengajar.id',
    role: 'teacher',
    bio: 'Psikolog & Praktisi Rekrutmen dengan pengalaman menyusun alat ukur seleksi pegawai ritel dan perusahaan besar.',
    is_active: true,
  },
  {
    id: 'demo-admin-1',
    full_name: 'Admin LokaTalenta',
    email: 'admin@ruanglatih.id',
    role: 'admin',
    bio: 'Pengelola operasional dan kurasi materi LokaTalenta.',
    is_active: true,
  },
];
