import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, PlusCircle, Send, ThumbsUp, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import type { CommunityPost } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';

const CATEGORIES = [
  'Semua',
  'Tips Psikotes',
  'Belajar Bahasa',
  'Karier & Interview',
  'Study Group',
];

export function CommunityPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedCat, setSelectedCat] = useState('Semua');
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tips Psikotes');
  const [content, setContent] = useState('');

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => lmsApi.listCommunityPosts(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      lmsApi.createCommunityPost({
        user_id: user!.id,
        author_name: user!.full_name,
        author_role: user!.role,
        category,
        title: title.trim(),
        content: content.trim(),
      }),
    onSuccess: () => {
      setTitle('');
      setContent('');
      setShowComposer(false);
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const { data: likedPostIds = [] } = useQuery({
    queryKey: ['community-liked-ids', user?.id],
    queryFn: () => (user ? lmsApi.listMyLikedPostIds(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
  });

  const likeMut = useMutation({
    mutationFn: (id: string) =>
      user ? lmsApi.likeCommunityPost(id, user.id) : Promise.reject(new Error('Silakan masuk.')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['community-liked-ids', user?.id] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => lmsApi.deleteCommunityPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const filteredPosts =
    selectedCat === 'Semua' ? posts : posts.filter((p) => p.category === selectedCat);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F766E] dark:text-teal-400">
            <Users className="w-4 h-4" />
            Komunitas LokaTalenta
          </div>
          <h1 className="text-2xl font-bold text-[#18181B] dark:text-white">
            Forum Diskusi &amp; Study Group
          </h1>
          <p className="text-sm text-[#52525B] dark:text-slate-300">
            Berbagi tips belajar bahasa, strategi psikotes kerja, dan diskusi bersama mentor maupun sesama peserta.
          </p>
        </div>

        {user ? (
          <Button onClick={() => setShowComposer((v) => !v)} className="shrink-0">
            <PlusCircle className="w-4 h-4" />
            Buat Topik Baru
          </Button>
        ) : (
          <Link to="/auth">
            <Button className="shrink-0">Masuk untuk Berdiskusi</Button>
          </Link>
        )}
      </div>

      {/* Composer */}
      {showComposer && user && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim() && content.trim()) createMut.mutate();
          }}
          className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-[#18181B] dark:text-white">
            Tulis Topik Diskusi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul topik..."
              className="sm:col-span-2 px-3.5 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900"
            >
              {CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bagikan pertanyaan, ringkasan belajar, atau tips Anda..."
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowComposer(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              Publikasikan Topik
            </Button>
          </div>
        </form>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCat(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              selectedCat === cat
                ? 'bg-[#0F766E] border-[#0F766E] text-white'
                : 'bg-white dark:bg-[#161B22] border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-10 text-center text-sm text-[#71717A] dark:text-slate-400">
          Belum ada topik diskusi pada kategori ini.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              isLiked={likedPostIds.includes(post.id)}
              canLike={Boolean(user)}
              onLike={() => likeMut.mutate(post.id)}
              onDelete={() => deleteMut.mutate(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityPostCard({
  post,
  isLiked,
  canLike,
  onLike,
  onDelete,
}: {
  post: CommunityPost;
  isLiked: boolean;
  canLike: boolean;
  onLike: () => void;
  onDelete: () => void;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');

  const { data: replies = [] } = useQuery({
    queryKey: ['community-replies', post.id],
    queryFn: () => lmsApi.listCommunityReplies(post.id),
  });

  const replyMut = useMutation({
    mutationFn: () =>
      lmsApi.addCommunityReply({
        post_id: post.id,
        user_id: user!.id,
        author_name: user!.full_name,
        author_role: user!.role,
        content: replyText.trim(),
      }),
    onSuccess: () => {
      setReplyText('');
      setShowReplies(true);
      queryClient.invalidateQueries({ queryKey: ['community-replies', post.id] });
    },
  });

  return (
    <article className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">{post.category}</Badge>
          <span className="text-xs font-bold text-[#18181B] dark:text-white">
            {post.author_name}
          </span>
          <Badge tone={post.author_role !== 'student' ? 'emerald' : 'slate'}>
            {post.author_role === 'teacher'
              ? 'Mentor'
              : post.author_role === 'admin'
              ? 'Admin'
              : 'Anggota'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#71717A] dark:text-slate-400">
          <span>{new Date(post.created_at).toLocaleDateString('id-ID')}</span>
          {user && (user.id === post.user_id || user.role !== 'student') && (
            <button
              type="button"
              onClick={onDelete}
              className="text-slate-400 hover:text-rose-600 cursor-pointer"
              title="Hapus topik"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <h3 className="text-base font-bold text-[#18181B] dark:text-white">{post.title}</h3>
      <p className="text-sm text-[#52525B] dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          disabled={!canLike}
          onClick={onLike}
          title={canLike ? (isLiked ? 'Batalkan dukungan' : 'Dukung topik ini') : 'Masuk untuk mendukung'}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
            !canLike
              ? 'bg-[#F6F5F1] dark:bg-slate-800 text-[#71717A] opacity-60 cursor-not-allowed'
              : isLiked
              ? 'bg-[#0F766E] text-white cursor-pointer'
              : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#18181B] dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'text-white' : 'text-[#0F766E]'}`} />
          {isLiked ? 'Didukung' : 'Dukung'} ({post.likes_count})
        </button>

        <button
          type="button"
          onClick={() => setShowReplies((v) => !v)}
          className="px-3 py-1.5 rounded-lg bg-[#F6F5F1] dark:bg-slate-800 text-xs font-semibold text-[#18181B] dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#0F766E]" />
          Balasan ({replies.length})
        </button>
      </div>

      {showReplies && (
        <div className="pt-3 border-t border-[#E5E3DC] dark:border-slate-800 space-y-3">
          {replies.map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60 text-xs space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#18181B] dark:text-white">{r.author_name}</span>
                <Badge tone={r.author_role !== 'student' ? 'emerald' : 'slate'}>
                  {r.author_role !== 'student' ? 'Mentor' : 'Anggota'}
                </Badge>
              </div>
              <p className="text-[#18181B] dark:text-slate-200">{r.content}</p>
            </div>
          ))}

          {user && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (replyText.trim()) replyMut.mutate();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Tulis balasan Anda..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900"
              />
              <Button type="submit" size="sm" disabled={replyMut.isPending}>
                <Send className="w-3.5 h-3.5" />
                Balas
              </Button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
