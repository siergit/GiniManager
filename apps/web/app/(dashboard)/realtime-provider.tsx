'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function RealtimeProvider() {
  const router = useRouter();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to work_items changes
    const channel = supabase
      .channel('work_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_items' },
        (payload) => {
          console.log('Work item changed:', payload);
          setLastUpdate(new Date().toISOString());
          // Auto-refresh page data after a short delay
          setTimeout(() => router.refresh(), 500);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        () => {
          setLastUpdate(new Date().toISOString());
          setTimeout(() => router.refresh(), 500);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          setLastUpdate(new Date().toISOString());
          setTimeout(() => router.refresh(), 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return lastUpdate ? (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-green-100 border border-green-300 px-3 py-1.5 text-xs text-green-700 shadow-sm animate-pulse">
      ● Live
    </div>
  ) : null;
}
