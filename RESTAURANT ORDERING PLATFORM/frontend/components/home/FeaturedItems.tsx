'use client';

import React, { useState } from 'react';
import { MenuItem } from '@/types';
import MenuCard from '@/components/menu/MenuCard';
import MenuItemModal from '@/components/menu/MenuItemModal';
import { useCartStore } from '@/store/cart';
import { toast } from '@/components/providers';

interface FeaturedItemsProps {
  items: MenuItem[];
}

export default function FeaturedItems({ items }: FeaturedItemsProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  function handleAddToCart(item: MenuItem) {
    addItem(item);
    toast(`${item.name} added to cart`, 'success');
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <MenuCard
            key={item.id}
            menuItem={item}
            onAddToCart={() => {
              setSelectedItem(item);
            }}
          />
        ))}
      </div>
      <MenuItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
