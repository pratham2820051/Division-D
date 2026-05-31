'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'My Products', href: '/seller/products', icon: Package },
  { label: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { label: 'Analytics', href: '/seller/analytics', icon: BarChart2 },
  { label: 'Settings', href: '/seller/settings', icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'seller') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'seller') return null;

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[250px] min-h-screen bg-white border-r border-[#E5E5E5] fixed left-0 top-0 bottom-0 z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#E5E5E5]">
          <Link href="/" className="flex items-center gap-2">
            <Store className="w-5 h-5 text-black" />
            <span className="text-lg font-bold tracking-[0.12em] uppercase text-black">Wearix</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase">Seller Portal</p>
        </div>

        {/* Seller info */}
        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/seller/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-black text-white'
                    : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F9F9F9]'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#E5E5E5]">
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-sm text-sm font-medium text-[#666666] hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 w-[250px] bg-white border-r border-[#E5E5E5] z-50 flex flex-col transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <Store className="w-5 h-5 text-black" />
            <span className="text-lg font-bold tracking-[0.12em] uppercase text-black">Wearix</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/seller/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-black text-white'
                    : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F9F9F9]'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#E5E5E5]">
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-sm text-sm font-medium text-[#666666] hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 lg:ml-[250px] flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E5E5E5] sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-sm transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span className="font-bold tracking-widest uppercase text-sm">Wearix Seller</span>
          </div>
        </header>

        {/* Mobile Bottom Tab Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] z-20 flex">
          {navItems.slice(0, 4).map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/seller/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-black' : 'text-gray-400'
                )}
              >
                <Icon className="w-5 h-5" />
                {label.split(' ').pop()}
              </Link>
            );
          })}
        </nav>

        {/* Page content */}
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
