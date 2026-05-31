import { generateOrderId, generateTrackingNumber } from '@/lib/utils';

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  trackingNumber: string;
}

export const mockOrders: Order[] = [
  {
    id: "ORD-12345",
    userId: "buyer1",
    date: "2026-05-15",
    status: "Delivered",
    items: [
      { productId: 1, name: "Classic Cotton Tee", price: 2299, quantity: 2, size: "M", color: "Black", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80" },
      { productId: 2, name: "Slim Fit Chinos", price: 4299, quantity: 1, size: "L", color: "Khaki", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200&q=80" }
    ],
    total: 8750,
    shippingAddress: { name: "John Doe", street: "123 Main St", city: "New York", state: "NY", zip: "10001", phone: "+1-555-0100" },
    trackingNumber: "TRK123456789"
  },
  {
    id: "ORD-12346",
    userId: "buyer1",
    date: "2026-05-20",
    status: "Processing",
    items: [
      { productId: 4, name: "Floral Midi Dress", price: 4799, quantity: 1, size: "S", color: "Blush", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&q=80" }
    ],
    total: 4750,
    shippingAddress: { name: "John Doe", street: "123 Main St", city: "New York", state: "NY", zip: "10001", phone: "+1-555-0100" },
    trackingNumber: "TRK987654321"
  },
  {
    id: "ORD-12347",
    userId: "buyer1",
    date: "2026-04-28",
    status: "Delivered",
    items: [
      { productId: 6, name: "Cashmere Blend Sweater", price: 6499, quantity: 1, size: "M", color: "Cream", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&q=80" },
      { productId: 9, name: "Children's Hoodie", price: 2399, quantity: 2, size: "6", color: "Orange", image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=200&q=80" }
    ],
    total: 11300,
    shippingAddress: { name: "John Doe", street: "123 Main St", city: "New York", state: "NY", zip: "10001", phone: "+1-555-0100" },
    trackingNumber: "TRK456789123"
  },
  {
    id: "ORD-12348",
    userId: "buyer1",
    date: "2026-04-10",
    status: "Cancelled",
    items: [
      { productId: 7, name: "Denim Jacket", price: 5499, quantity: 1, size: "L", color: "Classic Blue", image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=200&q=80" }
    ],
    total: 5500,
    shippingAddress: { name: "John Doe", street: "123 Main St", city: "New York", state: "NY", zip: "10001", phone: "+1-555-0100" },
    trackingNumber: "TRK321654987"
  },
  {
    id: "ORD-12349",
    userId: "buyer1",
    date: "2026-03-22",
    status: "Shipped",
    items: [
      { productId: 11, name: "Women's Blazer", price: 7799, quantity: 1, size: "S", color: "Black", image: "https://images.unsplash.com/photo-1548712865-9dba80d26399?w=200&q=80" },
      { productId: 15, name: "Kids Summer Dress", price: 1899, quantity: 1, size: "4T", color: "Pink", image: "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=200&q=80" }
    ],
    total: 9650,
    shippingAddress: { name: "John Doe", street: "123 Main St", city: "New York", state: "NY", zip: "10001", phone: "+1-555-0100" },
    trackingNumber: "TRK789123456"
  }
];

export const sellerOrders: Order[] = [
  {
    id: "ORD-22001",
    userId: "buyer2",
    date: "2026-05-28",
    status: "Processing",
    items: [
      { productId: 1, name: "Classic Cotton Tee", price: 2299, quantity: 3, size: "L", color: "White", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80" }
    ],
    total: 6750,
    shippingAddress: { name: "Sarah Smith", street: "456 Oak Ave", city: "Los Angeles", state: "CA", zip: "90001", phone: "+1-555-0200" },
    trackingNumber: "TRK111222333"
  },
  {
    id: "ORD-22002",
    userId: "buyer3",
    date: "2026-05-27",
    status: "Shipped",
    items: [
      { productId: 4, name: "Floral Midi Dress", price: 4799, quantity: 1, size: "M", color: "Sage", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&q=80" },
      { productId: 5, name: "High-Waist Yoga Pants", price: 3299, quantity: 2, size: "S", color: "Black", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=200&q=80" }
    ],
    total: 11250,
    shippingAddress: { name: "Emily Chen", street: "789 Pine St", city: "Chicago", state: "IL", zip: "60601", phone: "+1-555-0300" },
    trackingNumber: "TRK444555666"
  },
  {
    id: "ORD-22003",
    userId: "buyer4",
    date: "2026-05-26",
    status: "Delivered",
    items: [
      { productId: 6, name: "Cashmere Blend Sweater", price: 6499, quantity: 1, size: "L", color: "Camel", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&q=80" }
    ],
    total: 6500,
    shippingAddress: { name: "Michael Johnson", street: "321 Elm Dr", city: "Houston", state: "TX", zip: "77001", phone: "+1-555-0400" },
    trackingNumber: "TRK777888999"
  },
  {
    id: "ORD-22004",
    userId: "buyer5",
    date: "2026-05-25",
    status: "Processing",
    items: [
      { productId: 2, name: "Slim Fit Chinos", price: 4299, quantity: 2, size: "M", color: "Navy", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200&q=80" },
      { productId: 14, name: "Men's Polo Shirt", price: 2799, quantity: 1, size: "M", color: "Navy", image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=200&q=80" }
    ],
    total: 11250,
    shippingAddress: { name: "David Williams", street: "654 Maple Ln", city: "Phoenix", state: "AZ", zip: "85001", phone: "+1-555-0500" },
    trackingNumber: "TRK000111222"
  },
  {
    id: "ORD-22005",
    userId: "buyer6",
    date: "2026-05-24",
    status: "Cancelled",
    items: [
      { productId: 11, name: "Women's Blazer", price: 7799, quantity: 1, size: "XS", color: "Cream", image: "https://images.unsplash.com/photo-1548712865-9dba80d26399?w=200&q=80" }
    ],
    total: 7750,
    shippingAddress: { name: "Jennifer Davis", street: "987 Cedar Rd", city: "Philadelphia", state: "PA", zip: "19101", phone: "+1-555-0600" },
    trackingNumber: "TRK333444555"
  }
];
