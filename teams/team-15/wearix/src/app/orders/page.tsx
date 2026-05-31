'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  X,
  ExternalLink,
  MapPin,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { mockOrders, Order, OrderStatus } from '@/data/mockOrders';
import { formatCurrency, formatDate } from '@/lib/utils';

const TABS: { label: string; value: OrderStatus | 'All' }[] = [
  { label: 'All Orders', value: 'All' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const STATUS_CONFIG: Record<
  OrderStatus,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
  Delivered: {
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Delivered',
  },
  Processing: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    icon: <Clock className="w-4 h-4" />,
    label: 'Processing',
  },
  Shipped: {
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: <Truck className="w-4 h-4" />,
    label: 'Shipped',
  },
  Cancelled: {
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Cancelled',
  },
};

const TIMELINE_STEPS = [
  { label: 'Order Placed', icon: Package },
  { label: 'Processing', icon: Clock },
  { label: 'Shipped', icon: Truck },
  { label: 'Delivered', icon: CheckCircle },
];

function getActiveStep(status: OrderStatus): number {
  switch (status) {
    case 'Processing':
      return 1;
    case 'Shipped':
      return 2;
    case 'Delivered':
      return 3;
    case 'Cancelled':
      return 0;
    default:
      return 0;
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${cfg.bg} ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const activeStep = getActiveStep(order.status);
  const isCancelled = order.status === 'Cancelled';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                #{order.id}
              </h2>
              <p className="text-sm text-[#666666]">{formatDate(order.date)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F9F9F9] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#666666]" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <StatusBadge status={order.status} />
              <span className="text-sm text-[#666666]">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Status Timeline */}
            {!isCancelled && (
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 uppercase tracking-wider">
                  Order Progress
                </h3>
                <div className="relative">
                  {/* Track line */}
                  <div className="absolute top-5 left-5 right-5 h-px bg-[#E5E5E5]" />
                  <div
                    className="absolute top-5 left-5 h-px bg-black transition-all duration-500"
                    style={{
                      width: `${(activeStep / (TIMELINE_STEPS.length - 1)) * (100 - (100 / (TIMELINE_STEPS.length * 2)))}%`,
                    }}
                  />
                  <div className="relative flex justify-between">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isActive = idx <= activeStep;
                      return (
                        <div
                          key={step.label}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isActive
                                ? 'bg-black border-black text-white'
                                : 'bg-white border-[#E5E5E5] text-[#666666]'
                            }`}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-xs font-medium text-center ${
                              isActive ? 'text-[#1A1A1A]' : 'text-[#666666]'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">
                  This order was cancelled. If you were charged, a refund will
                  be processed within 5–7 business days.
                </p>
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider">
                Items Ordered
              </h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-3 bg-[#F9F9F9] rounded-sm"
                  >
                    <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-sm bg-[#E5E5E5]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p className="text-xs text-[#666666]">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-[#1A1A1A] shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t border-[#E5E5E5] pt-4 space-y-2">
              <div className="flex justify-between text-sm text-[#666666]">
                <span>Subtotal</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#666666]">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#1A1A1A] pt-2 border-t border-[#E5E5E5]">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider">
                Shipping Address
              </h3>
              <div className="flex gap-3 p-3 bg-[#F9F9F9] rounded-sm">
                <MapPin className="w-4 h-4 text-[#666666] mt-0.5 shrink-0" />
                <div className="text-sm text-[#666666]">
                  <p className="font-medium text-[#1A1A1A]">
                    {order.shippingAddress.name}
                  </p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zip}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-sm text-[#666666]">
                  <Phone className="w-3.5 h-3.5" />
                  {order.shippingAddress.phone}
                </div>
              </div>
            </div>

            {/* Tracking */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider">
                Tracking
              </h3>
              <div className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-sm">
                <div>
                  <p className="text-xs text-[#666666]">Tracking Number</p>
                  <p className="text-sm font-mono font-medium text-[#1A1A1A] mt-0.5">
                    {order.trackingNumber}
                  </p>
                </div>
                {order.status !== 'Cancelled' && order.status !== 'Processing' && (
                  <button className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-4 py-2 rounded-sm hover:bg-[#333] transition-colors">
                    Track Order
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function OrderCard({
  order,
  onViewDetails,
  index,
}: {
  order: Order;
  onViewDetails: () => void;
  index: number;
}) {
  const previewImages = order.items.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-white border border-[#E5E5E5] rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-[#666666] uppercase tracking-wider mb-1">
              Order ID
            </p>
            <p className="text-sm font-semibold text-[#1A1A1A] font-mono">
              #{order.id}
            </p>
            <p className="text-xs text-[#666666] mt-1">{formatDate(order.date)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Product thumbnails */}
        <div className="flex gap-2 mb-4">
          {previewImages.map((item, idx) => (
            <div
              key={idx}
              className="relative w-16 h-16 rounded-sm overflow-hidden bg-[#F9F9F9] shrink-0"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="w-16 h-16 rounded-sm bg-[#F9F9F9] flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-[#666666]">
                +{order.items.length - 3}
              </span>
            </div>
          )}
        </div>

        {/* Item names */}
        <p className="text-xs text-[#666666] mb-4 line-clamp-1">
          {order.items.map((i) => i.name).join(', ')}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
          <div>
            <p className="text-xs text-[#666666]">Total</p>
            <p className="text-base font-semibold text-[#1A1A1A]">
              {formatCurrency(order.total)}
            </p>
          </div>
          <button
            onClick={onViewDetails}
            className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-medium px-4 py-2.5 rounded-sm hover:bg-[#333] transition-colors"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'All'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#666666]">Loading orders…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const filteredOrders =
    activeTab === 'All'
      ? mockOrders
      : mockOrders.filter((o) => o.status === activeTab);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">
            My Orders
          </h1>
          <p className="text-[#666666] mt-1">
            {mockOrders.length} orders total
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-1 bg-white border border-[#E5E5E5] rounded-sm p-1 mb-8 overflow-x-auto"
        >
          {TABS.map((tab) => {
            const count =
              tab.value === 'All'
                ? mockOrders.length
                : mockOrders.filter((o) => o.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
                  activeTab === tab.value
                    ? 'bg-black text-white'
                    : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F9F9F9]'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.value
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F0F0F0] text-[#666666]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Orders Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {filteredOrders.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredOrders.map((order, idx) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={idx}
                    onViewDetails={() => setSelectedOrder(order)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-16 h-16 bg-[#F0F0F0] rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-[#666666]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                  No{' '}
                  {activeTab !== 'All' ? activeTab.toLowerCase() + ' ' : ''}
                  orders
                </h3>
                <p className="text-[#666666] text-sm max-w-xs">
                  {activeTab === 'All'
                    ? "You haven't placed any orders yet. Start shopping to see them here."
                    : `You don't have any orders with "${activeTab}" status.`}
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-6 bg-black text-white text-sm font-medium px-6 py-2.5 rounded-sm hover:bg-[#333] transition-colors"
                >
                  Start Shopping
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
