'use client';

import React from 'react';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/cart';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-border last:border-0">
      {/* Name & price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{item.menuItem.name}</p>
        <p className="text-xs text-text-muted">{formatCurrency(item.menuItem.price)} each</p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center border border-surface-border rounded-lg overflow-hidden">
        <button
          className="px-2 py-1 hover:bg-surface-muted transition-colors"
          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="px-2 py-1 text-xs font-semibold min-w-[1.75rem] text-center">
          {item.quantity}
        </span>
        <button
          className="px-2 py-1 hover:bg-surface-muted transition-colors"
          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Line total */}
      <span className="text-sm font-semibold text-primary w-16 text-right">
        {formatCurrency(item.menuItem.price * item.quantity)}
      </span>

      {/* Remove */}
      <button
        className="text-text-muted hover:text-red-600 transition-colors p-1"
        onClick={() => removeItem(item.menuItem.id)}
        aria-label={`Remove ${item.menuItem.name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
