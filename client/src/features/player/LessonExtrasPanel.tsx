import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  MessageSquare,
  Reply,
  Send,
  Star,
  Trash2,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import { AssignmentPanel } from './AssignmentPanel';
import { MentorChatPanel } from './MentorChatPanel';
import { MentoringSessionsPanel } from './MentoringSessionsPanel';

type ExtraTab = 'qa' | 'mentor_chat' | 'live_sessions' | 'assignments' | 'reviews';

export function LessonExtrasPanel({
  courseId,
  courseSlug,
  mentorId,
  mentorName,
  lessonId,
}: {
  courseId: string;
  courseSlug: string;
  mentorId: string;
  mentorName: string;
  lessonId: string;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ExtraTab>('qa');

  // Q&A state
  const [commentText, setCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Course review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: () => lmsApi.listLessonComments(lessonId),
    enabled: Boolean(lessonId),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['course-reviews', courseId],
    queryFn: () => lmsApi.listCourseReviews(courseId),
    enabled: Boolean(courseId),
  });

  const addCommentMut = useMutation({
    mutationFn: (payload?: { parent_id?: string | null; content: string; notify_user_id?: string }) =>
      lmsApi.addLessonComment({
        lesson_id: lessonId,
        user_id: user!.id,
        author_name: user!.full_name,
        author_role: user!.role,
        content: payload ? payload.content : commentText.trim(),
        parent_id: payload?.parent_id ?? null,
        notify_user_id: payload?.notify_user_id,
        course_slug: courseSlug,
      }),
    onSuccess: (_data, vars) => {
      if (vars?.parent_id) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setCommentText('');
      }
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-all-comments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteCommentMut = useMutation({
    mutationFn: (id: string) => lmsApi.deleteLessonComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
    },
  });

  const submitReviewMut = useMutation({
    mutationFn: () =>
      lmsApi.submitCourseReview({
        course_id: courseId,
        user_id: user!.id,
        author_name: user!.full_name,
        rating,
        comment: reviewComment.trim(),
      }),
    onSuccess: () => {
      setReviewSaved(true);
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-summaries'] });
      setTimeout(() => setReviewSaved(false), 2500);
    },
  });

  if (!user) return null;

  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#D4D4CE] dark:border-[#282E3D] pb-3">
        <button
          type="button"
          onClick={() => setTab('qa')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
            tab === 'qa'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Tanya Jawab ({comments.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('assignments')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
            tab === 'assignments'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Tugas
        </button>

        <button
          type="button"
          onClick={() => setTab('mentor_chat')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
            tab === 'mentor_chat'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Konsultasi Mentor
        </button>

        <button
          type="button"
          onClick={() => setTab('live_sessions')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
            tab === 'live_sessions'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Sesi Live
        </button>

        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
            tab === 'reviews'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Ulasan Kursus ({reviews.length})
        </button>
      </div>

      {tab === 'assignments' && (
        <AssignmentPanel courseId={courseId} courseSlug={courseSlug} lessonId={lessonId} />
      )}

      {tab === 'mentor_chat' && (
        <MentorChatPanel
          courseId={courseId}
          courseSlug={courseSlug}
          mentorId={mentorId}
          mentorName={mentorName}
        />
      )}

      {tab === 'live_sessions' && (
        <MentoringSessionsPanel courseId={courseId} courseSlug={courseSlug} />
      )}

      {/* TAB 1: FORUM Q&A (Threaded) */}
      {tab === 'qa' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (commentText.trim()) addCommentMut.mutate(undefined);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Tanyakan sesuatu atau berikan tanggapan tentang materi ini..."
              className="flex-1 px-3.5 py-2 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            <Button type="submit" size="sm" disabled={addCommentMut.isPending}>
              <Send className="w-3.5 h-3.5" />
              Kirim
            </Button>
          </form>

          {comments.filter((c) => !c.parent_id).length === 0 ? (
            <p className="text-xs text-[#71717A] dark:text-slate-400">
              Belum ada pertanyaan di materi ini. Jadilah yang pertama bertanya!
            </p>
          ) : (
            <div className="space-y-3">
              {comments
                .filter((c) => !c.parent_id)
                .map((c) => {
                  const replies = comments.filter((r) => r.parent_id === c.id);
                  const hasMentorReply = replies.some(
                    (r) => r.is_mentor_answer || r.author_role !== 'student'
                  );
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900/60 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#18181B] dark:text-white">
                            {c.author_name}
                          </span>
                          <Badge tone={c.author_role === 'teacher' ? 'blue' : 'slate'}>
                            {c.author_role === 'teacher'
                              ? 'Pengajar'
                              : c.author_role === 'admin'
                              ? 'Admin'
                              : 'Pelajar'}
                          </Badge>
                          {hasMentorReply && (
                            <Badge tone="emerald">
                              <CheckCircle2 className="w-3 h-3" />
                              Dijawab Mentor
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setReplyingToId(replyingToId === c.id ? null : c.id)
                            }
                            className="text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Reply className="w-3 h-3" />
                            Balas
                          </button>
                          {(c.user_id === user.id || user.role !== 'student') && (
                            <button
                              type="button"
                              onClick={() => deleteCommentMut.mutate(c.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Hapus komentar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-[#18181B] dark:text-slate-200">{c.content}</p>

                      {replies.length > 0 && (
                        <div className="pl-4 border-l-2 border-[#0F766E]/40 space-y-2 pt-1">
                          {replies.map((r) => (
                            <div
                              key={r.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-[#18181B] dark:text-white">
                                    {r.author_name}
                                  </span>
                                  <Badge tone={r.author_role !== 'student' ? 'emerald' : 'slate'}>
                                    {r.author_role !== 'student' ? 'Mentor' : 'Pelajar'}
                                  </Badge>
                                </div>
                                {(r.user_id === user.id || user.role !== 'student') && (
                                  <button
                                    type="button"
                                    onClick={() => deleteCommentMut.mutate(r.id)}
                                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Hapus balasan"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-[#18181B] dark:text-slate-200">
                                {r.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingToId === c.id && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (replyText.trim()) {
                              addCommentMut.mutate({
                                parent_id: c.id,
                                content: replyText.trim(),
                                notify_user_id: c.user_id,
                              });
                            }
                          }}
                          className="flex flex-col sm:flex-row gap-2 pt-1"
                        >
                          <input
                            type="text"
                            required
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Tulis balasan untuk pertanyaan ini..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22] text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                          />
                          <Button type="submit" size="sm" disabled={addCommentMut.isPending}>
                            Kirim Balasan
                          </Button>
                        </form>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COURSE RATING & REVIEWS */}
      {tab === 'reviews' && (
        <div className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitReviewMut.mutate();
            }}
            className="p-4 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900/60 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#18181B] dark:text-white">
                Beri Rating &amp; Ulasan Kursus
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={2}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Bagikan pengalaman belajar Anda di kursus ini..."
              className="w-full px-3 py-2 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                {reviewSaved ? 'Terima kasih atas ulasan Anda!' : ''}
              </span>
              <Button type="submit" size="sm" disabled={submitReviewMut.isPending}>
                {submitReviewMut.isPending ? 'Mengirim...' : 'Kirim Ulasan'}
              </Button>
            </div>
          </form>

          {reviews.length > 0 && (
            <div className="space-y-2.5">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#18181B] dark:text-white">
                      {rev.author_name}
                    </span>
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                      ★ {rev.rating}.0
                    </span>
                  </div>
                  <p className="text-sm text-[#52525B] dark:text-slate-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
