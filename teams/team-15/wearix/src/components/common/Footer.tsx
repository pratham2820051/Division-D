'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  Globe,
  AtSign,
  Share2,
  Play,
} from 'lucide-react';

// ── Footer link columns ───────────────────────────────────────────────────────
const FOOTER_COLUMNS = [
  {
    heading: 'Shop',
    links: [
      { label: "Men's",     href: '/shop?category=Men' },
      { label: "Women's",   href: '/shop?category=Women' },
      { label: 'Children',  href: '/shop?category=Children' },
      { label: 'New In',    href: '/shop?sort=newest' },
      { label: 'Sale',      href: '/shop?sort=sale' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us',  href: '/about' },
      { label: 'Blog',      href: '/blog' },
      { label: 'Contact',   href: '/contact' },
      { label: 'Careers',   href: '/careers' },
      { label: 'Press',     href: '/press' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center',      href: '/help' },
      { label: 'Returns & Refunds', href: '/returns' },
      { label: 'Track Your Order', href: '/orders' },
      { label: 'Live Chat',        href: '/contact#chat' },
      { label: 'Shipping Info',    href: '/shipping' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',    href: '/privacy' },
      { label: 'Terms of Service',  href: '/terms' },
      { label: 'Cookie Policy',     href: '/cookies' },
      { label: 'Accessibility',     href: '/accessibility' },
    ],
  },
];

// ── Social links ──────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com', Icon: AtSign  },
  { label: 'Twitter',   href: 'https://twitter.com',   Icon: Share2  },
  { label: 'Facebook',  href: 'https://facebook.com',  Icon: Globe   },
  { label: 'YouTube',   href: 'https://youtube.com',   Icon: Play    },
];

// ── Animation variants ────────────────────────────────────────────────────────
const columnVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

// ── Footer Component ──────────────────────────────────────────────────────────
export default function Footer() {
  const [email, setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]     = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
    setEmail('');
  };

  return (
    <footer className="bg-black text-white">
      {/* ── Newsletter bar ─────────────────────────────────────────────── */}
      <div className="border-b border-white/10">
        <div className="container py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Stay in the loop
            </h3>
            <p className="text-sm text-white/60 mt-1">
              New arrivals, exclusive offers and style inspiration — straight to your inbox.
            </p>
          </div>

          {submitted ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-white/80 flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-white/60" />
              You're subscribed. Welcome to Wearix.
            </motion.p>
          ) : (
            <form
              onSubmit={handleNewsletter}
              className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[360px]"
            >
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Enter your email"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-white/60 transition-colors"
                />
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-sm hover:bg-white/90 transition-colors whitespace-nowrap"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Main footer grid ───────────────────────────────────────────────── */}
      <div className="container py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">

          {/* Brand column */}
          <motion.div
            className="col-span-2 md:col-span-1"
            variants={columnVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={0}
          >
            <Link href="/" className="text-2xl font-bold tracking-[0.15em] text-white hover:opacity-70 transition-opacity">
              WEARIX
            </Link>
            <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-[200px]">
              Modern fashion crafted for every moment of your life.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-sm bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col, i) => (
            <motion.div
              key={col.heading}
              variants={columnVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              custom={i + 1}
            >
              <h4 className="text-xs font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/65 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40 text-center sm:text-left">
            © 2026 Wearix. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
