'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { isAuthenticated } from '@/lib/auth';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?returnUrl=/cart');
    }
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
