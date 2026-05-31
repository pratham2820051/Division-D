'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Link2,
  Clock,
  Calendar,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { mockBlogPosts, BlogPost } from '@/data/mockBlog';
import { formatDate } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Trends: 'bg-rose-100 text-rose-700',
  Sustainability: 'bg-emerald-100 text-emerald-700',
  'Style Guide': 'bg-violet-100 text-violet-700',
  Kids: 'bg-amber-100 text-amber-700',
  Brand: 'bg-blue-100 text-blue-700',
  Care: 'bg-teal-100 text-teal-700',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-rose-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-amber-500', 'bg-blue-500', 'bg-teal-500', 'bg-pink-500',
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

// Renders the post content with markdown-like headings, bold, lists
function renderContent(content: string): React.ReactNode[] {
  return content.split('\n\n').map((block, i) => {
    if (!block.trim()) return null;

    // Transform inline **bold** to <strong>
    const parseInline = (text: string): React.ReactNode => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j} className="font-semibold text-[#1A1A1A]">{part.slice(2, -2)}</strong>
          : part
      );
    };

    // Numbered list block (starts with "1. ")
    if (/^\d+\.\s/.test(block)) {
      const items = block.split('\n').filter(Boolean);
      return (
        <ol key={i} className="list-decimal list-inside space-y-2 my-5 text-[#444] leading-relaxed">
          {items.map((item, j) => {
            const text = item.replace(/^\d+\.\s\*\*([^*]+)\*\*:/, (_, m) => m + ':');
            return <li key={j} className="text-base">{parseInline(text)}</li>;
          })}
        </ol>
      );
    }

    // Bullet list block (starts with "- " or "* ")
    if (/^[-*]\s/.test(block)) {
      const items = block.split('\n').filter(Boolean);
      return (
        <ul key={i} className="list-disc list-inside space-y-2 my-5 text-[#444] leading-relaxed">
          {items.map((item, j) => (
            <li key={j} className="text-base">{parseInline(item.replace(/^[-*]\s/, ''))}</li>
          ))}
        </ul>
      );
    }

    // Bold heading (entire block is **...**)
    if (block.startsWith('**') && block.endsWith('**') && block.split('\n').length === 1) {
      return (
        <h3 key={i} className="text-xl font-bold text-[#1A1A1A] mt-8 mb-3">
          {block.slice(2, -2)}
        </h3>
      );
    }

    // Regular paragraph
    return (
      <p key={i} className="text-base text-[#444] leading-[1.85] my-4">
        {parseInline(block)}
      </p>
    );
  }).filter(Boolean) as React.ReactNode[];
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-black text-white px-5 py-3 shadow-2xl text-sm font-medium"
    >
      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {message}
    </motion.div>
  );
}

// ── Related Card ──────────────────────────────────────────────────────────────
function RelatedCard({ post }: { post: BlogPost }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col bg-white border border-[#E5E5E5] overflow-hidden hover:shadow-lg transition-shadow duration-300"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link href={`/blog/${post.slug}`} className="relative block overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className={`absolute top-3 left-3 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-sm ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-700'}`}>
          {post.category}
        </span>
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <Link href={`/blog/${post.slug}`}>
          <h4 className="text-sm font-bold text-[#1A1A1A] leading-snug mb-2 line-clamp-2 group-hover:underline underline-offset-2">
            {post.title}
          </h4>
        </Link>
        <p className="text-xs text-[#666] line-clamp-2 mb-3 flex-1">{post.excerpt}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-[#999]">
          <Clock className="w-3 h-3" />
          <span>{post.readTime}</span>
          <span className="mx-1">·</span>
          <span>{formatDate(post.date)}</span>
        </div>
      </div>
    </motion.article>
  );
}

// ── 404 Page ──────────────────────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <p className="text-8xl font-black text-[#E5E5E5] mb-6">404</p>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">Post not found</h1>
        <p className="text-[#666] mb-8">
          The article you're looking for doesn't exist or may have been moved.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-semibold hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </motion.div>
    </main>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0];
  const [toast, setToast] = useState<string | null>(null);
  const urlRef = useRef<string>('');

  useEffect(() => {
    urlRef.current = window.location.href;
  }, []);

  const post = mockBlogPosts.find((p) => p.slug === slug);

  if (!post) return <NotFoundPage />;

  // Related: same category, excluding current
  const relatedPosts = mockBlogPosts
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3);

  // Fall back to any 3 posts if not enough in category
  const fallbackRelated = mockBlogPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  const displayRelated = relatedPosts.length >= 1 ? relatedPosts : fallbackRelated;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(urlRef.current || window.location.href);
      setToast('Link copied to clipboard!');
    } catch {
      setToast('Could not copy link');
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`"${post.title}" — via @Wearix`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '62vh' }}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

        {/* back link */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute top-8 left-8"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Blog
          </Link>
        </motion.div>

        {/* hero text */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-14 md:px-16 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className={`inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-sm mb-4 ${CATEGORY_COLORS[post.category] ?? 'bg-white/20 text-white'}`}>
              {post.category}
            </span>
            <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight mb-5">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(post.author)}`}>
                  {getInitials(post.author)}
                </div>
                <span className="font-medium text-white">{post.author}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/60 text-xs italic">{post.authorRole}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(post.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Article Body ── */}
      <section className="max-w-2xl mx-auto px-6 py-14 md:py-20">
        {/* excerpt lead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="text-lg md:text-xl text-[#333] font-medium leading-relaxed border-l-4 border-black pl-5 mb-10 italic"
        >
          {post.excerpt}
        </motion.p>

        {/* content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="prose-wearix"
        >
          {renderContent(post.content)}
        </motion.div>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-[#E5E5E5]"
        >
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-[#F9F9F9] border border-[#E5E5E5] text-[#666]"
            >
              #{tag}
            </span>
          ))}
        </motion.div>

        {/* ── Share Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-[#999] mr-2">Share</span>
          <button
            onClick={handleTwitterShare}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] text-[#1A1A1A] text-xs font-semibold hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-all duration-200"
          >
            <Share2 className="w-3.5 h-3.5" /> Twitter
          </button>
          <button
            onClick={handleFacebookShare}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] text-[#1A1A1A] text-xs font-semibold hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all duration-200"
          >
            <Share2 className="w-3.5 h-3.5" /> Facebook
          </button>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] text-[#1A1A1A] text-xs font-semibold hover:bg-black hover:text-white hover:border-black transition-all duration-200"
          >
            <Link2 className="w-3.5 h-3.5" /> Copy Link
          </button>
        </motion.div>

        {/* ── Author Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mt-12 p-7 bg-[#F9F9F9] border border-[#E5E5E5] flex gap-5"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black flex-shrink-0 ${getAvatarColor(post.author)}`}>
            {getInitials(post.author)}
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#999] mb-1">Written by</p>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-0.5">{post.author}</h3>
            <p className="text-sm text-[#666] italic mb-3">{post.authorRole}</p>
            <p className="text-sm text-[#555] leading-relaxed">
              {post.author} is a passionate contributor to Wearix Journal, bringing deep expertise in
              {' '}{post.category.toLowerCase()} and a genuine love for helping people dress with intention.
              Their writing blends industry knowledge with accessible, practical advice.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Related Posts ── */}
      {displayRelated.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-8 pb-20">
          <div className="border-t border-[#E5E5E5] pt-12 mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#999] mb-1">Keep Reading</p>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Related Stories</h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-black tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              All Posts <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayRelated.map((related) => (
              <RelatedCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Toast key="toast" message={toast} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}
