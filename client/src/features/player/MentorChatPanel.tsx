import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';

export function MentorChatPanel({
  courseId,
  courseSlug,
  mentorId,
  mentorName,
}: {
  courseId: string;
  courseSlug: string;
  mentorId: string;
  mentorName: string;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data: messages = [] } = useQuery({
    queryKey: ['mentor-messages', courseId, user?.id],
    queryFn: () =>
      user ? lmsApi.listMentorMessages(courseId, user.id) : Promise.resolve([]),
    enabled: Boolean(user && courseId),
  });

  const sendMut = useMutation({
    mutationFn: () =>
      lmsApi.sendMentorMessage({
        course_id: courseId,
        course_slug: courseSlug,
        student_id: user!.id,
        mentor_id: mentorId,
        sender_id: user!.id,
        sender_name: user!.full_name,
        sender_role: user!.role,
        message: text.trim(),
      }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['mentor-messages', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-mentor-messages'] });
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#18181B] dark:text-white flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-[#0F766E]" />
            Konsultasi Privat dengan {mentorName}
          </p>
          <p className="text-xs text-[#71717A] dark:text-slate-400">
            Pesan di sini bersifat privat dan hanya dapat dilihat oleh Anda dan mentor kursus.
          </p>
        </div>
        <Badge tone="emerald">1-on-1 Privat</Badge>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/50 border border-[#E5E3DC] dark:border-slate-700">
        {messages.length === 0 ? (
          <p className="text-xs text-[#71717A] dark:text-slate-400 text-center py-6">
            Belum ada pesan konsultasi. Tanyakan kendala belajar atau hasil latihan Anda kepada mentor.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === user.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs space-y-1 ${
                    isMine
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-slate-200'
                  }`}
                >
                  <p className="font-semibold text-[11px] opacity-85">
                    {m.sender_name} {m.sender_role !== 'student' ? '(Mentor)' : ''}
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) sendMut.mutate();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan konsultasi pribadi untuk mentor..."
          className="flex-1 px-3.5 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-[#161B22] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
        />
        <Button type="submit" size="sm" disabled={sendMut.isPending}>
          <Send className="w-3.5 h-3.5" />
          Kirim Pesan
        </Button>
      </form>
    </div>
  );
}
