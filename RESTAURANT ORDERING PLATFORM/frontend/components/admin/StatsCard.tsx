import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'text-primary' }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-text">{value}</p>
            {trend && (
              <span className="text-xs text-green-600 font-medium mt-1 inline-block">
                {trend}
              </span>
            )}
          </div>
          <div className={cn('p-2 rounded-lg bg-surface-muted', color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
