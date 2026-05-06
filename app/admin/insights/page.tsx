'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';

interface Insights {
  topCategory: string;
  categoryCount: { [key: string]: number };
  averageSeverity: number;
  resolutionRate: number;
}

export default function AdminInsightsPage() {
  const supabase = createClient();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data: reports } = await supabase
        .from('reports')
        .select('*');

      if (!reports || reports.length === 0) {
        setInsights({
          topCategory: 'N/A',
          categoryCount: {},
          averageSeverity: 0,
          resolutionRate: 0,
        });
        return;
      }

      // Calculate insights
      const categoryCount: { [key: string]: number } = {};
      let totalSeverity = 0;
      let resolvedCount = 0;

      reports.forEach((report) => {
        categoryCount[report.category] = (categoryCount[report.category] || 0) + 1;
        totalSeverity += report.severity || 0;
        if (report.status === 'resolved') resolvedCount++;
      });

      const topCategory = Object.keys(categoryCount).sort(
        (a, b) => (categoryCount[b] || 0) - (categoryCount[a] || 0)
      )[0] || 'N/A';

      const averageSeverity = totalSeverity / reports.length;
      const resolutionRate = (resolvedCount / reports.length) * 100;

      setInsights({
        topCategory,
        categoryCount,
        averageSeverity,
        resolutionRate,
      });
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Unable to load insights</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Insights & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Top Issue Category</p>
          <p className="text-3xl font-bold text-primary capitalize">{insights.topCategory}</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Average Severity</p>
          <p className="text-3xl font-bold text-primary">
            {insights.averageSeverity.toFixed(1)}/5
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Resolution Rate</p>
          <p className="text-3xl font-bold text-primary">
            {insights.resolutionRate.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Issue Categories Breakdown</h2>
        <div className="space-y-2">
          {Object.entries(insights.categoryCount).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between p-3 bg-muted/30 rounded">
              <span className="capitalize text-foreground font-medium">{category}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        ((count as number) /
                          Math.max(
                            ...Object.values(insights.categoryCount).map((v) => v as number)
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="font-bold text-primary w-8">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
