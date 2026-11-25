/**
 * Utilities for Course Player & Lesson Theatre video scaling and embeds.
 */

/**
 * Sanitize and format video URLs to avoid player chrome letterboxing and intrusive embeds.
 * Converts YouTube watch URLs and shortlinks into privacy-enhanced zero-distraction embeds.
 */
export function formatVideoEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // YouTube standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch && ytWatchMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytWatchMatch[1]}?rel=0&modestbranding=1&playsinline=1`;
  }

  // Already an embed URL or custom provider (Vimeo, self-hosted, etc.)
  return trimmed;
}
