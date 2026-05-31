'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const stats = [
  { label: 'Total Revenue',    value: '₹6,24,000',  change: '+18.2%', up: true,  icon: DollarSign },
  { label: 'Orders This Month', value: '84',       change: '+12.5%', up: true,  icon: ShoppingBag },
  { label: 'New Customers',    value: '31',        change: '-4.1%',  up: false, icon: Users },
  { label: 'Product Views',    value: '2,340',     change: '+27.8%', up: true,  icon: Eye },
];

const topProducts = [
  { name: 'Classic White Tee',       sales: 42, revenue: 62979, trend: '+12%' },
  { name: 'Slim Fit Chinos',         sales: 35, revenue: 104983, trend: '+8%'  },
  { name: 'Floral Summer Dress',     sales: 28, revenue: 83986, trend: '+22%' },
  { name: 'Oversized Hoodie',        sales: 24, revenue: 83988, trend: '-3%'  },
  { name: 'Kids Denim Jacket',       sales: 19, revenue: 47491,  trend: '+5%'  },
];

const monthlyData = [
  { month: 'Jan', revenue: 160000 },
  { month: 'Feb', revenue: 205000 },
  { month: 'Mar', revenue: 190000 },
  { month: 'Apr', revenue: 260000 },
  { month: 'May', revenue: 235000 },
  { month: 'Jun', revenue: 305000 },
  { month: 'Jul', revenue: 290000 },
  { month: 'Aug', revenue: 360000 },
  { month: 'Sep', revenue: 325000 },
  { month: 'Oct', revenue: 405000 },
  { month: 'Nov', revenue: 470000 },
  { month: 'Dec', revenue: 624000 },
];

const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));

export default function SellerAnalyticsPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Analytics</h1>
        <p className="text-sm text-[#666666] mt-1">Track your store performance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-[#E5E5E5] rounded-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#666666] uppercase tracking-wider">{stat.label}</span>
                <div className="w-8 h-8 bg-[#F9F9F9] rounded-sm flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#666666]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
                {stat.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {stat.change} vs last month
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-6">Monthly Revenue (2024)</h2>
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.04, duration: 0.5 }}
                  className="w-full bg-black rounded-t-sm min-h-[4px]"
                  title={formatCurrency(d.revenue)}
                />
                <span className="text-[9px] text-[#999] font-medium">{d.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top products */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Top Products</h2>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#999] w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1A1A1A] truncate">{p.name}</p>
                  <p className="text-[11px] text-[#999]">{p.sales} sales · {formatCurrency(p.revenue)}</p>
                </div>
                <span className={`text-[11px] font-semibold ${p.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                  {p.trend}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Category breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white border border-[#E5E5E5] rounded-sm p-6"
      >
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Sales by Category</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { label: 'Men',      pct: 42, color: 'bg-black' },
            { label: 'Women',    pct: 38, color: 'bg-[#666666]' },
            { label: 'Children', pct: 20, color: 'bg-[#CCCCCC]' },
          ].map((cat) => (
            <div key={cat.label}>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-[#1A1A1A]">{cat.label}</span>
                <span className="text-[#666666]">{cat.pct}%</span>
              </div>
              <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.pct}%` }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  className={`h-full rounded-full ${cat.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
