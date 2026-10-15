'use client';

import React from 'react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      role="listbox"
      aria-label="Filter by category"
    >
      {/* All pill */}
      <button
        onClick={() => onSelect(null)}
        role="option"
        aria-selected={selectedId === null}
        className={cn(
          'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
          selectedId === null
            ? 'bg-primary text-white'
            : 'bg-surface-muted text-text-muted hover:bg-surface-border'
        )}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          role="option"
          aria-selected={selectedId === cat.id}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedId === cat.id
              ? 'bg-primary text-white'
              : 'bg-surface-muted text-text-muted hover:bg-surface-border'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
