'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AtSign, Share2, Globe, Play, ArrowRight } from 'lucide-react';

const footerLinks = {
  Shop: [
    { label: "Men's Wear", href: '/shop?category=Men' },
    { label: "Women's Wear", href: '/shop?category=Women' },
    { label: "Children's Wear", href: '/shop?category=Children' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
    { label: 'Sale', href: '/shop?sale=true' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Sustainability', href: '/about#sustainability' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Track Your Order', href: '/orders' },
    { label: 'Contact Us', href: '/contact' },
  ],
};

const socialLinks = [
  { icon: AtSign, href: '#', label: 'Instagram' },
  { icon: Share2, href: '#', label: 'Twitter' },
  { icon: Globe,  href: '#', label: 'Facebook' },
  { icon: Play,   href: '#', label: 'YouTube' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-[#1A1A1A] text-white">
      {/* Newsletter strip */}
      <div className="border-b border-white/10 py-12 px-8 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-white/50 mb-2">
              Newsletter
            </p>
            <h3 className="text-xl font-semibold text-white">
              Stay ahead of the drop
            </h3>
            <p className="text-white/50 text-sm mt-1">
              New collections, exclusive offers, style inspiration — direct to your inbox.
            </p>
          </div>

          {subscribed ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/70 text-sm font-medium"
            >
              ✓ You&apos;re subscribed! Welcome to Wearix.
            </motion.p>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex items-stretch w-full md:w-auto min-w-0 md:min-w-[380px]"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border border-white/20 text-white text-sm px-4 py-3 placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-black text-xs font-bold tracking-widest uppercase px-5 py-3 hover:bg-black hover:text-white hover:border hover:border-white transition-colors duration-300 flex-shrink-0 flex items-center gap-2"
              >
                Subscribe
                <ArrowRight size={13} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main footer content */}
      <div className="py-16 px-8 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <span className="text-2xl font-bold tracking-[0.15em] text-white uppercase">
                WEARIX
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-6">
              Premium fashion for men, women, and children. Where style meets substance
              since 2014.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/50 hover:border-white hover:text-white transition-all duration-300"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">
                {category}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6 px-8 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Wearix. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-white/30 text-xs hover:text-white/60 transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
