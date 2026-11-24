export type UserRole = 'student' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  bio?: string;
  is_active?: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

export interface StudentProgressSummary {
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  completed_lessons: number;
  total_lessons: number;
  latest_quiz_score: number | null;
}

export interface LessonComment {
  id: string;
  lesson_id: string;
  user_id: string;
  author_name: string;
  author_role: UserRole;
  content: string;
  parent_id?: string | null;
  is_mentor_answer?: boolean;
  created_at: string;
}

export interface TeacherCommentItem extends LessonComment {
  course_id: string;
  course_slug: string;
  course_title: string;
  lesson_title: string;
  reply_count: number;
  has_mentor_reply: boolean;
}

export interface MentorMessage {
  id: string;
  course_id: string;
  student_id: string;
  mentor_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  created_at: string;
}

export interface MentoringSession {
  id: string;
  course_id: string;
  mentor_id?: string | null;
  mentor_name: string;
  title: string;
  topic: string;
  scheduled_at: string;
  meeting_url: string;
  max_participants: number;
  created_at: string;
}

export interface MentoringBooking {
  id: string;
  session_id: string;
  user_id: string;
  student_name: string;
  created_at: string;
}

export interface CourseAnnouncement {
  id: string;
  course_id: string;
  cohort_id?: string | null;
  author_id?: string | null;
  author_name: string;
  title: string;
  content: string;
  created_at: string;
}

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CourseRatingSummary {
  avg: number;
  count: number;
}

export interface QuizOption {
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface SafeQuestion {
  id: string;
  category_tag: string;
  question_type?: 'mcq' | 'short_answer';
  accepted_answers?: string[];
  case_sensitive?: boolean;
  question_text: string;
  image_url?: string | null;
  audio_text?: string | null;
  audio_lang?: 'ja-JP' | 'en-US' | 'ko-KR' | null;
  options: QuizOption[];
  order_index: number;
}

export interface Question extends SafeQuestion {
  quiz_id: string;
  correct_option: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  use_subtests?: boolean;
  question_limit?: number | null;
  questions?: Question[];
}

export interface VoiceLine {
  text: string;
  romaji?: string;
  translation: string;
  lang: 'ja-JP' | 'en-US' | 'ko-KR';
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  type: 'article' | 'video' | 'quiz';
  content: string;
  video_url?: string | null;
  voice_lines?: VoiceLine[];
  duration_minutes: number;
  order_index: number;
  quiz?: Quiz | null;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: 'Pemula' | 'Menengah' | 'Lanjutan' | 'Semua Level';
  estimated_hours: number;
  thumbnail_url?: string | null;
  is_published: boolean;
  created_at?: string;
  modules?: Module[];
}

export interface CategoryScore {
  total: number;
  correct: number;
}

export type CategoryBreakdown = Record<string, CategoryScore>;

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  category_breakdown: CategoryBreakdown | null;
  answers: Record<string, string>;
  question_ids?: string[] | null;
  tab_switch_count?: number;
  focus_loss_events?: Array<{ at: string; type: 'hidden' | 'blur' }>;
}

export interface ReviewQuestion extends SafeQuestion {
  correct_option: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
}

export interface AssignmentRubricItem {
  stars: 1 | 2 | 3 | 4 | 5;
  label: string;
  description: string;
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  cohort_id?: string | null;
  lesson_id?: string | null;
  title: string;
  instructions: string;
  requires_file?: boolean;
  task_brief?: string;
  how_to_guide?: string;
  rubric?: AssignmentRubricItem[];
  due_date?: string | null;
  max_score: number;
  created_by?: string | null;
  created_at: string;
}

export type SubmissionStatus =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'graded'
  | 'needs_revision';

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  student_name: string;
  submission_text: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  status: SubmissionStatus;
  rating_stars?: number | null;
  score?: number | null;
  feedback?: string | null;
  submitted_at: string;
  graded_at?: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  xp: number;
  level: number;
  completed_lessons: number;
  passed_quizzes: number;
}

export interface CertificateRecord {
  id: string;
  cert_code: string;
  user_id: string;
  student_name: string;
  course_id: string;
  course_title: string;
  teacher_name: string;
  issued_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  author_role: UserRole;
  category: string;
  title: string;
  content: string;
  likes_count: number;
  created_at: string;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_role: UserRole;
  content: string;
  created_at: string;
}

export type SrsRating = 'hard' | 'medium' | 'easy';

export type NotificationType = 'grade' | 'comment' | 'course' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}
