'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Save, Store, Bell, Shield, CreditCard, CheckCircle } from 'lucide-react';

export default function SellerSettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    storeName: 'My Wearix Store',
    storeDescription: 'Premium fashion for every occasion.',
    contactEmail: user?.email ?? '',
    phone: '+1 (555) 000-0000',
    address: '123 Fashion Ave, New York, NY 10001',
    notifications: {
      newOrder: true,
      lowStock: true,
      reviews: false,
      promotions: true,
    },
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Settings</h1>
        <p className="text-sm text-[#666666] mt-1">Manage your seller account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Store Info */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-4 h-4 text-[#666666]" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Store Information</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Store Name</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Business Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Store Description</label>
              <textarea
                rows={3}
                value={form.storeDescription}
                onChange={(e) => setForm({ ...form, storeDescription: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-[#666666]" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Notifications</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'newOrder',    label: 'New Order',       desc: 'Get notified when a customer places an order' },
              { key: 'lowStock',    label: 'Low Stock Alert', desc: 'Alert when product inventory falls below 5 units' },
              { key: 'reviews',     label: 'New Reviews',     desc: 'Notify when customers leave product reviews' },
              { key: 'promotions',  label: 'Promotions',      desc: 'Receive tips and promotional opportunities' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
                  <p className="text-xs text-[#999] mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      notifications: {
                        ...form.notifications,
                        [key]: !form.notifications[key as keyof typeof form.notifications],
                      },
                    })
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    form.notifications[key as keyof typeof form.notifications]
                      ? 'bg-black'
                      : 'bg-[#E5E5E5]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      form.notifications[key as keyof typeof form.notifications]
                        ? 'translate-x-5'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Security */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-[#666666]" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Security</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </motion.section>

        {/* Payment */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-4 h-4 text-[#666666]" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Payout Settings</h2>
          </div>
          <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm p-4 text-sm text-[#666666]">
            <p className="font-medium text-[#1A1A1A] mb-1">Bank Account ending in ••••4242</p>
            <p className="text-xs">Payouts processed every Monday. Next payout: June 2, 2026</p>
          </div>
        </motion.section>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium rounded-sm hover:bg-[#1A1A1A] transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
