import React, { Suspense } from 'react';
import Link from 'next/link';
import { ShoppingBag, CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import FeaturedItems from '@/components/home/FeaturedItems';

async function getFeaturedItems(): Promise<MenuItem[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/menu/items?limit=6`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? json).slice(0, 6);
  } catch {
    return [];
  }
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-surface-border">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-text mb-1">{title}</h4>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const featuredItems = await getFeaturedItems();

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[80vh] bg-gray-900 flex items-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 max-w-2xl">
            Taste the <span className="text-primary-light">Difference</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-xl">
            Explore our menu, reserve your table, and enjoy a seamless dining experience — all in one place.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/menu">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Order Now
              </Button>
            </Link>
            <Link href="/reserve">
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-2 border-white text-white hover:bg-white hover:text-text"
              >
                <CalendarDays className="w-5 h-5" />
                Reserve a Table
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-text text-center mb-10">
            Everything you need, in one place
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShoppingBag className="w-6 h-6" />}
              title="Order Online"
              description="Browse our full menu and place orders from anywhere, anytime."
            />
            <FeatureCard
              icon={<CalendarDays className="w-6 h-6" />}
              title="Reserve a Table"
              description="Book your preferred table in advance and skip the wait."
            />
            <FeatureCard
              icon={<MapPin className="w-6 h-6" />}
              title="Track Your Order"
              description="Get real-time updates on your order from kitchen to table."
            />
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text">Featured Dishes</h2>
            <Link
              href="/menu"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            }
          >
            <FeaturedItems items={featuredItems} />
          </Suspense>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-surface-muted">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-text text-center mb-10">How It Works</h2>
          <div className="space-y-6">
            <HowItWorksStep
              number={1}
              title="Browse the Menu"
              description="Explore categories, search for your favourites, and check ingredients & allergens."
            />
            <HowItWorksStep
              number={2}
              title="Add to Cart & Checkout"
              description="Select items, choose dine-in, takeaway, or delivery, and pay securely with Stripe."
            />
            <HowItWorksStep
              number={3}
              title="Track in Real Time"
              description="Watch your order move through our kitchen with live status updates."
            />
          </div>
        </div>
      </section>
    </>
  );
}
