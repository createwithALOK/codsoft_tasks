'use client';

import React from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, spiceLevelCount } from '@/lib/utils';

interface MenuCardProps {
  menuItem: MenuItem;
  onAddToCart: () => void;
}

function SpiceDots({ level }: { level: string | number }) {
  const count = spiceLevelCount(level);
  return (
    <div className="flex gap-0.5" aria-label={`Spice level: ${level}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={`text-xs ${i < count ? 'text-red-500' : 'text-gray-300'}`}>
          🌶
        </span>
      ))}
    </div>
  );
}

export default function MenuCard({ menuItem, onAddToCart }: MenuCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      {/* Unavailable overlay */}
      {!menuItem.isAvailable && (
        <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-xl">
          <span className="text-sm font-semibold text-text-muted bg-surface-muted px-3 py-1 rounded-full border border-surface-border">
            Unavailable
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 w-full bg-surface-muted">
        {menuItem.imageUrl ? (
          <Image
            src={menuItem.imageUrl}
            alt={menuItem.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-4xl">
            🍽
          </div>
        )}
        {/* Veg/Non-veg badge */}
        <span
          className={`absolute top-2 left-2 w-4 h-4 rounded-full border-2 border-white ${menuItem.isVeg ? 'bg-green-500' : 'bg-red-500'}`}
          aria-label={menuItem.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
        />
      </div>

      <CardContent className="pt-3 pb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-text text-sm leading-tight line-clamp-1">
            {menuItem.name}
          </h3>
          <SpiceDots level={menuItem.spiceLevel} />
        </div>

        <p className="text-xs text-text-muted line-clamp-2 mb-3">
          {menuItem.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-bold text-primary text-sm">
            {formatCurrency(menuItem.price)}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onAddToCart}
            disabled={!menuItem.isAvailable}
            aria-label={`Add ${menuItem.name} to cart`}
          >
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
