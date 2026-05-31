'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Calendar, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { mockBlogPosts, BlogPost } from '@/data/mockBlog';
import { formatDate } from '@/lib/utils';

const CATEGORIES = ['All', 'Trends', 'Sustainability', 'Style Guide', 'Kids', 'Brand', 'Care'];

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
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
    visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: { duration: 0.25 },
  },
};

// ── Featured Post ────────────────────────────────────────────────────────────
function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="relative w-full overflow-hidden rounded-none group"
      style={{ aspectRatio: '21/9' }}
    >
      <Image
        src={post.image}
        alt={post.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="100vw"
        priority
      />
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className={`inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-sm mb-4 ${CATEGORY_COLORS[post.category] ?? 'bg-white/20 text-white'}`}>
            {post.category}
          </span>
          <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight mb-3">
            {post.title}
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-6 max-w-xl line-clamp-2">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(post.author)}`}>
              {getInitials(post.author)}
            </div>
            <span className="text-white/70 text-sm">{post.author}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60 text-sm">{formatDate(post.date)}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60 text-sm">{post.readTime}</span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-semibold tracking-wide hover:bg-black hover:text-white transition-colors duration-200"
          >
            Read Story <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* featured label */}
      <div className="absolute top-6 left-6 bg-black text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5">
        Featured
      </div>
    </motion.div>
  );
}

// ── Blog Card ─────────────────────────────────────────────────────────────────
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <motion.article
      variants={cardVariants}
      layout
      className="group flex flex-col bg-white border border-[#E5E5E5] overflow-hidden hover:shadow-xl transition-shadow duration-300"
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
    >
      {/* image */}
      <Link href={`/blog/${post.slug}`} className="relative block overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* category badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold tracking-wider uppercase rounded-sm ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-700'}`}>
          {post.category}
        </span>
      </Link>

      {/* body */}
      <div className="flex flex-col flex-1 p-6">
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-[20px] font-bold text-[#1A1A1A] leading-snug mb-2 group-hover:underline underline-offset-2 transition-all line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <p className="text-[#666666] text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {post.excerpt}
        </p>

        {/* meta row */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${getAvatarColor(post.author)}`}>
              {getInitials(post.author)}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold text-[#1A1A1A]">{post.author}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-[#999]" />
                <span className="text-[11px] text-[#666]">{formatDate(post.date)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#666] text-xs">
            <Clock className="w-3 h-3" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* read more */}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-black tracking-wide uppercase hover:gap-3 transition-all duration-200"
        >
          Read More <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const featuredPost = mockBlogPosts[0];
  const remainingPosts = mockBlogPosts.slice(1);

  const filteredPosts = activeCategory === 'All'
    ? remainingPosts
    : remainingPosts.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-[#F9F9F9]">
      {/* ── Header ── */}
      <section className="bg-white border-b border-[#E5E5E5] px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#666] mb-3">Wearix Journal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-tight mb-4">
            Latest Stories
          </h1>
          <p className="text-[#666666] text-base md:text-lg max-w-md mx-auto">
            Fashion insights, style guides, and brand stories
          </p>
        </motion.div>
      </section>

      {/* ── Featured Post ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-6">
        <FeaturedPost post={featuredPost} />
      </section>

      {/* ── Category Filters ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap items-center gap-2 mb-10"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-all duration-200 border ${
                activeCategory === cat
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-[#666] border-[#E5E5E5] hover:border-black hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* ── Grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))
            ) : (
              <motion.div
                variants={cardVariants}
                className="col-span-full text-center py-24"
              >
                <p className="text-[#666] text-lg">No posts in this category yet.</p>
                <button
                  onClick={() => setActiveCategory('All')}
                  className="mt-4 text-sm font-semibold underline underline-offset-4 text-black hover:opacity-70 transition-opacity"
                >
                  View all posts
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── Footer spacer ── */}
      <div className="h-24" />
    </main>
  );
}
