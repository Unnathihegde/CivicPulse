'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { MapMarker } from '@/components/ui/leaflet-map';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/ui/leaflet-map').then(m => m.LeafletMap), {
  ssr: false,
});

export default function MapPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      pothole: '🕳️',
      streetlight: '💡',
      graffiti: '🎨',
      debris: '🗑️',
      other: '📍',
    };
    return icons[category] || '📍';
  };

  const mapMarkers: MapMarker[] = reports
    .filter((r) => r.lat && r.lng)
    .map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      category: r.category,
      severity: r.severity || 1,
      popupContent: (
        <div className="p-2 min-w-40 text-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-foreground capitalize">
            <span>{getCategoryIcon(r.category)}</span>
            <span>{r.category}</span>
          </div>
          <p className="text-muted-foreground line-clamp-2 max-w-xs">{r.summary}</p>
          <div className="mt-2 text-xs flex justify-between items-center">
            <span className={`px-2 py-1 rounded-full ${r.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {r.status}
            </span>
            <span className="text-muted-foreground opacity-70">
              Severity: {r.severity}
            </span>
          </div>
        </div>
      ),
    }));

  return (
    <div className="p-4 md:p-6 space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Issue Map</h1>
        <p className="text-muted-foreground text-lg mt-1">Explore and pinpoint civic issues across your community.</p>
      </div>

      <div className="flex-grow w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 relative z-0 transition-all hover:shadow-3xl">
        <Map markers={mapMarkers} className="h-full w-full" />
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-md dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/20 flex gap-4 overflow-x-auto no-scrollbar shrink-0 transition-all hover:shadow-xl">
        <div className="min-w-fit pr-4 border-r border-border/50 flex items-center justify-center">
          <h2 className="text-sm font-bold text-foreground whitespace-nowrap">Recent Activity</h2>
        </div>
        {reports.slice(0, 5).map((report, idx) => (
          <div key={idx} className="flex flex-col items-center min-w-16 shrink-0 bg-primary/5 hover:bg-primary/10 border border-primary/10 p-2 rounded-xl transition cursor-pointer hover:scale-105">
            <p className="text-2xl">{getCategoryIcon(report.category)}</p>
            <p className="text-[10px] text-foreground font-semibold mt-1 capitalize">{report.category}</p>
          </div>
        ))}
        {reports.length === 0 && !isLoading && (
          <div className="flex items-center text-sm text-muted-foreground px-4">
            No recent reports found
          </div>
        )}
      </div>
    </div>
  );
}
