'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';

interface TopReporter {
  id: string;
  name: string;
  points: number;
  rank: number;
}

export default function Leaderboard() {
  const supabase = createClient();
  const [topReporters, setTopReporters] = useState<TopReporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopReporters();
  }, []);

  const fetchTopReporters = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, points')
        .order('points', { ascending: false })
        .limit(10);

      const topReporters = data?.map((reporter, index) => ({
        ...reporter,
        rank: index + 1,
      })) || [];

      setTopReporters(topReporters);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md dark:bg-gray-900/70 rounded-3xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <span className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl text-yellow-600 dark:text-yellow-400">🏆</span>
        Top Reporters
      </h2>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : topReporters.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No reporters yet</p>
      ) : (
        <div className="space-y-2">
          {topReporters.map((reporter) => (
            <div
              key={reporter.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-border/50 transition hover:bg-primary/5 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary w-6">#{reporter.rank}</span>
                <span className="text-sm font-medium text-foreground">
                  {reporter.name || 'Anonymous'}
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {reporter.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
