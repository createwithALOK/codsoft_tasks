'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, spiceLevelCount } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { Minus, Plus, Clock } from 'lucide-react';

interface MenuItemModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuItemModal({ item, isOpen, onClose }: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  if (!item) return null;

  function handleAddToCart() {
    if (!item) return;
    for (let i = 0; i < quantity; i++) {
      addItem(item);
    }
    setQuantity(1);
    onClose();
  }

  const spiceLabel = '🌶'.repeat(spiceLevelCount(item.spiceLevel) || 0) || 'Mild';

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Image */}
        <div className="relative h-52 w-full bg-surface-muted rounded-lg mb-4 overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍽</div>
          )}
        </div>

        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle>{item.name}</DialogTitle>
            {/* Veg/Non-veg dot */}
            <span
              className={`w-4 h-4 rounded-full border-2 border-surface-border mt-0.5 flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}
              aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
            />
          </div>
        </DialogHeader>

        <p className="text-sm text-text-muted mb-4">{item.description}</p>

        {/* Info row */}
        <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.preparationTime} min
          </span>
          <span>Spice: {spiceLabel}</span>
          <span>{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
        </div>

        {/* Price */}
        <p className="text-xl font-bold text-primary mb-4">{formatCurrency(item.price)}</p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-text">Quantity:</span>
          <div className="flex items-center border border-surface-border rounded-lg overflow-hidden">
            <button
              className="px-3 py-1.5 hover:bg-surface-muted transition-colors disabled:opacity-40"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">
              {quantity}
            </span>
            <button
              className="px-3 py-1.5 hover:bg-surface-muted transition-colors"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
          >
            {item.isAvailable
              ? `Add to Cart · ${formatCurrency(item.price * quantity)}`
              : 'Unavailable'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
