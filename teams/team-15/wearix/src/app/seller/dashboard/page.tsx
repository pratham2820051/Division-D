'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useMotionValue, useTransform, animate, Variants } from 'framer-motion';
import {
  Package,
  TrendingUp,
  Clock,
  DollarSign,
  Plus,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { sellerOrders, type Order, type OrderStatus } from '@/data/mockOrders';
import { mockProducts } from '@/data/mockProducts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ── Animated count-up number ─────────────────────────────────────────────────
function CountUp({ to, prefix = '', suffix = '', duration = 1.4 }: {
  to: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    `${prefix}${v % 1 === 0 ? Math.round(v).toLocaleString('en-IN') : v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`
  );

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(motionVal, to, { duration });
    return ctrl.stop;
  }, [inView, to, motionVal, duration]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    Processing: 'bg-blue-50 text-blue-700 border-blue-200',
    Shipped: 'bg-amber-50 text-amber-700 border-amber-200',
    Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={cn('px-2.5 py-0.5 text-xs font-medium rounded-full border', styles[status])}>
      {status}
    </span>
  );
}

// ── Stats data ────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Products', value: 16, prefix: '', suffix: '', icon: Package, color: 'bg-violet-50 text-violet-600' },
  { label: 'Total Sales', value: 622500, prefix: '₹', suffix: '', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Pending Orders', value: 3, prefix: '', suffix: '', icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: 'Revenue This Month', value: 160000, prefix: '₹', suffix: '', icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function SellerDashboardPage() {
  const lowStockProducts = mockProducts.filter((p) => p.stock < 50);
  const recentOrders: Order[] = sellerOrders.slice(0, 6);

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1A1A] tracking-tight">Seller Dashboard</h1>
        <p className="text-sm text-[#666666] mt-1">Welcome back — here's what's happening today.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {STATS.map(({ label, value, prefix, suffix, icon: Icon, color }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            whileHover={{ scale: 1.02, translateY: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            className="bg-white border border-[#E5E5E5] rounded-sm p-5 cursor-default transition-shadow"
          >
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">
              <CountUp to={value} prefix={prefix} suffix={suffix} />
            </p>
            <p className="text-xs text-[#666666] mt-1 font-medium">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="xl:col-span-2 bg-white border border-[#E5E5E5] rounded-sm"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
            <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-widest">Recent Orders</h2>
            <Link
              href="/seller/orders"
              className="flex items-center gap-1 text-xs text-[#666666] hover:text-black transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E5E5]">
                  {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + idx * 0.06 }}
                    className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-[#1A1A1A] font-semibold whitespace-nowrap">
                      {order.id}
                    </td>
                    <td className="px-5 py-3.5 text-[#1A1A1A] whitespace-nowrap">
                      {order.shippingAddress.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#666666] max-w-[140px] truncate">
                      {order.items[0].name}
                      {order.items.length > 1 && (
                        <span className="ml-1 text-xs text-gray-400">+{order.items.length - 1}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#1A1A1A] whitespace-nowrap">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-[#666666] whitespace-nowrap text-xs">
                      {formatDate(order.date)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Low Stock Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white border border-[#E5E5E5] rounded-sm"
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E5E5E5]">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-widest">Low Stock</h2>
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {lowStockProducts.length}
              </span>
            </div>
            <ul className="divide-y divide-[#F0F0F0] max-h-64 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover rounded-sm"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">{product.name}</p>
                    <p className="text-xs text-[#666666]">{product.category}</p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
                      product.stock < 10
                        ? 'bg-red-100 text-red-700'
                        : product.stock < 30
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white border border-[#E5E5E5] rounded-sm p-5"
          >
            <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link
                href="/seller/products/upload"
                className="flex items-center justify-center gap-2 bg-black text-white text-sm font-semibold px-4 py-3 rounded-sm hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </Link>
              <Link
                href="/seller/orders"
                className="flex items-center justify-center gap-2 border border-[#E5E5E5] text-[#1A1A1A] text-sm font-semibold px-4 py-3 rounded-sm hover:bg-[#F9F9F9] transition-colors"
              >
                <ShoppingBagIcon className="w-4 h-4" />
                View All Orders
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Inline icon to avoid extra import issues
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
