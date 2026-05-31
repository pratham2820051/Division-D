'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ShoppingBag,
  Menu,
  X,
  User,
  ChevronDown,
  Package,
  LayoutDashboard,
  Headphones,
  LogOut,
  LogIn,
  Search,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home',    href: '/' },
  { label: 'About',   href: '/about' },
  { label: 'Shop',    href: '/shop' },
  { label: 'Blog',    href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

// ── Animation variants ────────────────────────────────────────────────────────
const mobileMenuVariants: Variants = {
  hidden:  { opacity: 0, height: 0, overflow: 'hidden' },
  visible: {
    opacity: 1,
    height: 'auto',
    overflow: 'hidden',
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
    transition: { duration: 0.25 },
  },
};

const dropdownVariants: Variants = {
  hidden:  { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.15 },
  },
};

// ── Navbar Component ──────────────────────────────────────────────────────────
export default function Navbar() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  const [isScrolled,      setIsScrolled]      = useState(false);
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Scroll shadow ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Lock body scroll when mobile menu open ───────────────────────────────
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileOpen(false);
    logout();
    router.push('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
          isScrolled ? 'shadow-[0_1px_0_#E5E5E5] shadow-sm' : 'border-b border-[#E5E5E5]'
        }`}
      >
        <nav className="container flex items-center justify-between h-16">

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="text-xl font-bold tracking-[0.15em] text-black hover:opacity-70 transition-opacity duration-200"
            onClick={closeMobile}
          >
            WEARIX
          </Link>

          {/* ── Desktop Nav Links ─────────────────────────────────────────── */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-[#1A1A1A] hover:text-black transition-colors duration-200 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-black transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          {/* ── Right Actions ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">

            {/* Search */}
            <Link
              href="/shop"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F5F5F5] hover:bg-[#EAEAEA] transition-colors duration-200"
              aria-label="Search items"
            >
              <Search className="w-4 h-4 text-black" strokeWidth={2} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#F5F5F5] transition-colors duration-200"
              aria-label={`Cart (${itemCount} items)`}
            >
              <ShoppingBag className="w-4.5 h-4.5 text-[#1A1A1A]" strokeWidth={2} />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-black text-white text-[9px] font-semibold rounded-full px-1 leading-none"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              )}
            </Link>

            {/* User / Auth */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1 p-1 rounded-full hover:bg-[#F5F5F5] transition-colors duration-200"
                  aria-haspopup="menu"
                  aria-expanded={userDropdownOpen}
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-semibold select-none">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#666666] transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                    strokeWidth={2}
                  />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      role="menu"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2 w-52 bg-white border border-[#E5E5E5] shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-sm overflow-hidden z-50"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-[#E5E5E5]">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{user?.name}</p>
                        <p className="text-xs text-[#666666] truncate mt-0.5">{user?.email}</p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <DropdownItem
                          icon={<Package className="w-4 h-4" />}
                          label="My Orders"
                          href="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                        />

                        {user?.role === 'seller' && (
                          <DropdownItem
                            icon={<LayoutDashboard className="w-4 h-4" />}
                            label="Seller Dashboard"
                            href="/seller/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                          />
                        )}

                        {user?.role === 'support' && (
                          <DropdownItem
                            icon={<Headphones className="w-4 h-4" />}
                            label="Support Dashboard"
                            href="/support"
                            onClick={() => setUserDropdownOpen(false)}
                          />
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-[#E5E5E5] py-1">
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-[#F9F9F9] transition-colors duration-150"
                        >
                          <LogOut className="w-4 h-4 text-[#666666]" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#F5F5F5] transition-colors duration-200"
                aria-label="Login"
                title="Sign In"
              >
                <User className="w-4.5 h-4.5 text-[#1A1A1A]" strokeWidth={2} />
              </Link>
            )}

            {/* Shop all items CTA Button */}
            <Link
              href="/shop"
              className="hidden sm:flex items-center justify-center px-5 py-2.5 bg-black hover:bg-black/90 text-white text-xs font-semibold rounded-full transition-all duration-200 tracking-wide"
            >
              Shop all items
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-sm hover:bg-[#F9F9F9] transition-colors duration-200"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0,   opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0,  opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>

        {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden border-t border-[#E5E5E5] bg-white"
            >
              <div className="container py-4 space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.25 }}
                  >
                    <Link
                      href={link.href}
                      onClick={closeMobile}
                      className="block py-3 text-base font-medium text-[#1A1A1A] border-b border-[#E5E5E5] hover:text-black transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile auth section */}
                <div className="pt-4 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 pb-3 border-b border-[#E5E5E5]">
                        <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white font-semibold">
                          {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">{user?.name}</p>
                          <p className="text-xs text-[#666666]">{user?.email}</p>
                        </div>
                      </div>

                      <Link
                        href="/orders"
                        onClick={closeMobile}
                        className="flex items-center gap-3 py-2.5 text-sm text-[#1A1A1A] hover:text-black"
                      >
                        <Package className="w-4 h-4 text-[#666666]" />
                        My Orders
                      </Link>

                      {user?.role === 'seller' && (
                        <Link
                          href="/seller/dashboard"
                          onClick={closeMobile}
                          className="flex items-center gap-3 py-2.5 text-sm text-[#1A1A1A] hover:text-black"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#666666]" />
                          Seller Dashboard
                        </Link>
                      )}

                      {user?.role === 'support' && (
                        <Link
                          href="/support"
                          onClick={closeMobile}
                          className="flex items-center gap-3 py-2.5 text-sm text-[#1A1A1A] hover:text-black"
                        >
                          <Headphones className="w-4 h-4 text-[#666666]" />
                          Support Dashboard
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 py-2.5 text-sm text-[#1A1A1A] hover:text-black"
                      >
                        <LogOut className="w-4 h-4 text-[#666666]" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={closeMobile}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white text-sm font-medium rounded-sm hover:bg-[#1A1A1A] transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── DropdownItem sub-component ─────────────────────────────────────────────
interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick?: () => void;
}

function DropdownItem({ icon, label, href, onClick }: DropdownItemProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-[#F9F9F9] transition-colors duration-150"
    >
      <span className="text-[#666666]">{icon}</span>
      {label}
    </Link>
  );
}
