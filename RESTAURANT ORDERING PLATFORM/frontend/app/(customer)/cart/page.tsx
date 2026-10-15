'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { isAuthenticated } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import CartItem from '@/components/cart/CartItem';
import { ShoppingBag } from 'lucide-react';

type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?returnUrl=/cart');
    }
  }, [router]);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  function handleCheckout() {
    // Store order type configuration in session storage for checkout page
    sessionStorage.setItem(
      'dinedesk-order-config',
      JSON.stringify({ orderType, tableNumber, address })
    );
    router.push('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-surface-border mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text mb-2">Your cart is empty</h2>
        <p className="text-text-muted mb-6 text-sm">Add some items from our menu to get started.</p>
        <Link href="/menu">
          <Button variant="primary">Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text">
                Items ({items.length})
              </h2>
            </CardHeader>
            <CardContent className="pt-0">
              {items.map((item) => (
                <CartItem key={item.menuItem.id} item={item} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text">Order Summary</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Type */}
              <div>
                <p className="text-sm font-medium text-text mb-2">Order Type</p>
                <div className="space-y-2">
                  {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as OrderType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="orderType"
                        value={type}
                        checked={orderType === type}
                        onChange={() => setOrderType(type)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text">
                        {type === 'DINE_IN'
                          ? 'Dine In'
                          : type === 'TAKEAWAY'
                          ? 'Takeaway'
                          : 'Delivery'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Table number for DINE_IN */}
              {orderType === 'DINE_IN' && (
                <div>
                  <label className="text-sm font-medium text-text block mb-1">
                    Table Number
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    min={1}
                  />
                </div>
              )}

              {/* Address for DELIVERY */}
              {orderType === 'DELIVERY' && (
                <div>
                  <label className="text-sm font-medium text-text block mb-1">
                    Delivery Address
                  </label>
                  <Textarea
                    placeholder="Enter your full delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-surface-border pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Tax (5%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-text pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={orderType === 'DELIVERY' && !address.trim()}
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
