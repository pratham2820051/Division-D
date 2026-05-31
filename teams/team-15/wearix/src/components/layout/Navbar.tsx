'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Search, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Men', href: '/shop?category=Men' },
  { label: 'Women', href: '/shop?category=Women' },
  { label: 'Children', href: '/shop?category=Children' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
];

export default function Navbar() {
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 z-10">
            <span
              className={`text-xl font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${
                scrolled ? 'text-[#1A1A1A]' : 'text-white'
              }`}
            >
              WEARIX
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-xs font-medium tracking-wider uppercase transition-colors duration-200 ${
                  scrolled ? 'text-[#666666] hover:text-[#1A1A1A]' : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className={`hidden sm:flex w-8 h-8 items-center justify-center transition-colors duration-200 ${
                scrolled ? 'text-[#666666] hover:text-[#1A1A1A]' : 'text-white/80 hover:text-white'
              }`}
            >
              <Search size={18} />
            </button>

            {/* Account */}
            <Link
              href="/account"
              aria-label="Account"
              className={`hidden sm:flex w-8 h-8 items-center justify-center transition-colors duration-200 ${
                scrolled ? 'text-[#666666] hover:text-[#1A1A1A]' : 'text-white/80 hover:text-white'
              }`}
            >
              <User size={18} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Cart"
              className={`relative w-8 h-8 flex items-center justify-center transition-colors duration-200 ${
                scrolled ? 'text-[#1A1A1A]' : 'text-white'
              }`}
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ border: scrolled ? '1.5px solid white' : '1.5px solid transparent' }}
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              className={`lg:hidden w-8 h-8 flex items-center justify-center transition-colors duration-200 ${
                scrolled ? 'text-[#1A1A1A]' : 'text-white'
              }`}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center pt-24 px-6"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white p-2 flex items-center"
            >
              <Search size={18} className="text-[#666] mx-4 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search for products…"
                className="flex-1 text-[#1A1A1A] text-base py-3 pr-4 focus:outline-none placeholder:text-[#999]"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-3 text-[#666] hover:text-[#1A1A1A]"
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[55] bg-white flex flex-col pt-20 px-8"
          >
            <nav className="flex flex-col gap-2 mt-6">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-4 text-2xl font-semibold text-[#1A1A1A] border-b border-[#F0F0F0] hover:text-[#666] transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm text-[#666] font-medium"
              >
                <User size={16} /> My Account
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
