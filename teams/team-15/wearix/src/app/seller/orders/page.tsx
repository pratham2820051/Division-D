'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, ChevronDown, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { mockOrders } from '@/data/mockOrders';
import { formatCurrency } from '@/lib/utils';

const STATUS_CONFIG = {
  Processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800', icon: Package },
  Shipped:    { label: 'Shipped',    color: 'bg-blue-100 text-blue-800',   icon: Truck },
  Delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800', icon: CheckCircle },
  Cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800',     icon: XCircle },
} as const;

type OrderStatus = keyof typeof STATUS_CONFIG;

// Extend mock orders with seller-relevant fields
const sellerOrders = mockOrders.map((order, i) => ({
  ...order,
  customer: ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee', 'Emma Davis'][i % 5],
  customerEmail: ['alice@example.com', 'bob@example.com', 'carol@example.com', 'david@example.com', 'emma@example.com'][i % 5],
}));

export default function SellerOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<(typeof sellerOrders)[0] | null>(null);

  const filtered = sellerOrders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Orders</h1>
        <p className="text-sm text-[#666666] mt-1">Manage and track customer orders</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = sellerOrders.filter((o) => o.status === key).length;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E5E5E5] rounded-sm p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#666666] uppercase tracking-wider">{cfg.label}</span>
                <Icon className="w-4 h-4 text-[#999]" />
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{count}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-[#E5E5E5] rounded-sm text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-[#E5E5E5] rounded-sm text-sm focus:outline-none focus:border-black appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999] pointer-events-none" />
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-[#E5E5E5] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666666] uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666666] uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666666] uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666666] uppercase tracking-wider hidden sm:table-cell">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666666] uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666666] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#666666] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#999] text-sm">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.Processing;
                  return (
                    <tr key={order.id} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#666666]">{order.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A1A1A]">{order.customer}</p>
                        <p className="text-xs text-[#999]">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-[#666666] hidden md:table-cell">
                        {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-[#666666] hidden sm:table-cell">{order.items.length}</td>
                      <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#1A1A1A] hover:text-black border border-[#E5E5E5] px-2.5 py-1.5 rounded-sm hover:bg-[#F9F9F9] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-sm max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Order {selectedOrder.id}</h2>
                <p className="text-sm text-[#666666] mt-0.5">{selectedOrder.customer}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#999] hover:text-[#1A1A1A] transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-[#E5E5E5] last:border-0">
                  <div className="w-12 h-12 bg-[#F9F9F9] rounded-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</p>
                    <p className="text-xs text-[#999]">Size: {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex justify-between">
              <span className="font-semibold text-[#1A1A1A]">Total</span>
              <span className="font-bold text-[#1A1A1A]">{formatCurrency(selectedOrder.total)}</span>
            </div>

            {/* Status update */}
            <div className="mt-6">
              <label className="text-xs font-semibold text-[#666666] uppercase tracking-wider block mb-2">
                Update Status
              </label>
              <select className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-black">
                <option value="Processing" selected={selectedOrder.status === 'Processing'}>Processing</option>
                <option value="Shipped" selected={selectedOrder.status === 'Shipped'}>Shipped</option>
                <option value="Delivered" selected={selectedOrder.status === 'Delivered'}>Delivered</option>
                <option value="Cancelled" selected={selectedOrder.status === 'Cancelled'}>Cancelled</option>
              </select>
              <button className="mt-3 w-full bg-black text-white text-sm font-medium py-2.5 rounded-sm hover:bg-[#1A1A1A] transition-colors">
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
