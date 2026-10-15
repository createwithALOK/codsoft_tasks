import React, { Suspense } from 'react';
import { Category, MenuItem } from '@/types';
import MenuPageClient from '@/components/menu/MenuPageClient';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/api/menu/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return [];
  }
}

async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/menu/items`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'Menu — DineDesk',
};

export default async function MenuPage() {
  const [categories, items] = await Promise.all([getCategories(), getMenuItems()]);

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-full mb-6" />
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <MenuPageClient categories={categories} items={items} />
    </Suspense>
  );
}
