'use client';

import React from 'react';
import Link from 'next/link';
import { X, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import CartItem from './CartItem';

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const items = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={toggleCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h2 className="font-semibold text-text">
            Cart
            {getTotalItems() > 0 && (
              <span className="ml-2 text-xs bg-primary text-white rounded-full px-2 py-0.5">
                {getTotalItems()}
              </span>
            )}
          </h2>
          <button
            onClick={toggleCart}
            className="text-text-muted hover:text-text transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
              <ShoppingBag className="w-12 h-12 opacity-40" />
              <p className="text-sm">Your cart is empty</p>
              <Link href="/menu" onClick={toggleCart}>
                <Button variant="outline" size="sm">Browse Menu</Button>
              </Link>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItem key={item.menuItem.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-surface-border space-y-3">
            <div className="flex justify-between text-sm font-semibold text-text">
              <span>Subtotal</span>
              <span>{formatCurrency(getTotalPrice())}</span>
            </div>
            <div className="flex gap-2">
              <Link href="/cart" className="flex-1" onClick={toggleCart}>
                <Button variant="outline" size="sm" className="w-full">
                  View Cart
                </Button>
              </Link>
              <Link href="/checkout" className="flex-1" onClick={toggleCart}>
                <Button variant="primary" size="sm" className="w-full">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
