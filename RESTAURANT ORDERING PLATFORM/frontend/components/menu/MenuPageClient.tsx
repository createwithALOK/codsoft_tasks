'use client';

import React, { useState, useMemo } from 'react';
import { MenuItem, Category } from '@/types';
import CategoryFilter from './CategoryFilter';
import MenuCard from './MenuCard';
import MenuItemModal from './MenuItemModal';
import CartDrawer from '@/components/cart/CartDrawer';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cart';
import { toast } from '@/components/providers';
import { Search } from 'lucide-react';

interface MenuPageClientProps {
  categories: Category[];
  items: MenuItem[];
}

export default function MenuPageClient({ categories, items }: MenuPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  function handleAddToCart(item: MenuItem) {
    addItem(item);
    toast(`${item.name} added to cart`, 'success');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Search menu items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search menu items"
        />
      </div>

      {/* Category filter */}
      <div className="mb-6">
        <CategoryFilter
          categories={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Item count */}
      <p className="text-sm text-text-muted mb-4">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-text-muted">
          <p className="text-lg font-medium mb-2">No items found</p>
          <p className="text-sm">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <MenuCard
              key={item.id}
              menuItem={item}
              onAddToCart={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <MenuItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Cart drawer */}
      <CartDrawer />
    </div>
  );
}
