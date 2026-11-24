import type { Course } from '../../shared/types/lms';
import type { CohortRecord } from '../cohort/cohortApi';
import {
  buildScheduledTryoutEvents,
  getTryoutEventStatus,
} from '../tryout/tryoutEvents';

export type AgendaCategory = 'tryout' | 'cohort' | 'course';

export interface StudyAgendaItem {
  id: string;
  category: AgendaCategory;
  title: string;
  subtitle: string;
  scheduledAt: string;
  urgency: 'live' | 'soon' | 'normal';
  badgeLabel: string;
  actionLabel: string;
  actionPath: string;
}

export function buildStudyAgendaItems(input: {
  registeredTryoutIds: string[];
  cohorts: CohortRecord[];
  enrolledCourses: Course[];
  completedLessonIds: string[];
  nowMs?: number;
}): StudyAgendaItem[] {
  const nowMs = input.nowMs ?? Date.now();
  const items: StudyAgendaItem[] = [];

  // 1. Registered or Live Tryout Akbar events
  const tryouts = buildScheduledTryoutEvents(nowMs);
  for (const ev of tryouts) {
    const status = getTryoutEventStatus(ev, nowMs);
    if (status === 'ended') continue;
    const isRegistered = input.registeredTryoutIds.includes(ev.id);
    if (!isRegistered && status !== 'live') continue;

    items.push({
      id: `tryout-${ev.id}`,
      category: 'tryout',
      title: ev.title,
      subtitle: `${ev.category} • ${ev.questionCount} soal (${ev.durationMinutes} mnt)`,
      scheduledAt: ev.startAt,
      urgency: status === 'live' ? 'live' : 'soon',
      badgeLabel: status === 'live' ? 'LIVE Sekarang' : 'Tryout Terdaftar',
      actionLabel: status === 'live' ? 'Masuk Tryout' : 'Lihat Jadwal',
      actionPath: '/tryout',
    });
  }

  // 2. Active Cohort linked courses
  for (const cohort of input.cohorts) {
    const linked = input.enrolledCourses.find((c) => c.id === cohort.course_id);
    items.push({
      id: `cohort-${cohort.id}`,
      category: 'cohort',
      title: cohort.name,
      subtitle: cohort.course_title
        ? `Target Kursus: ${cohort.course_title}`
        : 'Kelas Privat Aktif',
      scheduledAt: new Date(nowMs + 2 * 24 * 60 * 60 * 1000).toISOString(),
      urgency: 'soon',
      badgeLabel: 'Cohort Aktif',
      actionLabel: linked ? 'Buka Kursus' : 'Jelajahi Katalog',
      actionPath: linked ? `/courses/${linked.slug}` : '/',
    });
  }

  // 3. In-progress enrolled courses
  for (const course of input.enrolledCourses.slice(0, 3)) {
    const lessons = (course.modules ?? []).flatMap((m) => m.lessons);
    const done = lessons.filter((l) => input.completedLessonIds.includes(l.id)).length;
    if (lessons.length > 0 && done >= lessons.length) continue;

    items.push({
      id: `course-${course.id}`,
      category: 'course',
      title: course.title,
      subtitle: `Progres ${done}/${lessons.length} materi selesai`,
      scheduledAt: new Date(nowMs + 5 * 24 * 60 * 60 * 1000).toISOString(),
      urgency: 'normal',
      badgeLabel: 'Lanjutkan Belajar',
      actionLabel: 'Buka Materi',
      actionPath: `/courses/${course.slug}`,
    });
  }

  return items.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

export function buildIcsCalendarEvent(item: StudyAgendaItem): string {
  const start = new Date(item.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LokaTalenta//Study Agenda//ID',
    'BEGIN:VEVENT',
    `UID:${item.id}@lokatalenta.id`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${item.title}`,
    `DESCRIPTION:${item.subtitle}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
