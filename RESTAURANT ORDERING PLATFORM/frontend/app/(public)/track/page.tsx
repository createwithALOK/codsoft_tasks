'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

export default function TrackLookupPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim()) return;
    router.push(`/track/${orderId.trim()}`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-text">Track your order</h1>
      </div>
      <p className="text-sm text-text-muted mb-6">
        Enter the order ID from your confirmation screen, or open it from My Orders after signing in.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Order ID">
          <Input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Paste your order ID"
          />
        </FormField>
        <Button type="submit" variant="primary" className="w-full" disabled={!orderId.trim()}>
          Track Order
        </Button>
      </form>
    </div>
  );
}
