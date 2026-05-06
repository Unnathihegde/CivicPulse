'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import AdminReportsTable from '@/components/admin/reports-table';
import { MapMarker } from '@/components/ui/leaflet-map';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, Activity, CheckCircle2 } from 'lucide-react';

const Map = dynamic(() => import('@/components/ui/leaflet-map').then((mod) => mod.LeafletMap), {
  ssr: false,
});

interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to realtime updates
    const subscription = supabase
      .channel('reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all reports
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReports(reportsData || []);

      // Calculate stats
      const total = reportsData?.length || 0;
      const pending = reportsData?.filter((r: any) => r.status === 'pending').length || 0;
      const inProgress = reportsData?.filter((r: any) => r.status === 'in-progress' || r.status === 'assigned').length || 0;
      const resolved = reportsData?.filter((r: any) => r.status === 'resolved').length || 0;

      setStats({
        totalReports: total,
        pendingReports: pending,
        inProgressReports: inProgress,
        resolvedReports: resolved,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Even on error, render empty state so it doesn't break
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

  console.log("Admin reports:", reports);

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
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage and track reported civic issues across the city.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Reports"
          value={stats?.totalReports || 0}
          icon={FileText}
          gradient="from-blue-600 to-indigo-600"
        />
        <StatCard
          title="Pending"
          value={stats?.pendingReports || 0}
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressReports || 0}
          icon={Activity}
          gradient="from-cyan-500 to-blue-500"
        />
        <StatCard
          title="Resolved"
          value={stats?.resolvedReports || 0}
          icon={CheckCircle2}
          gradient="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Reports View */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 hover:shadow-lg transition">
        <Tabs defaultValue="list" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">All Reports</h2>
            <TabsList className="bg-muted/80 p-1 rounded-xl">
              <TabsTrigger value="list" className="rounded-lg px-4">List View</TabsTrigger>
              <TabsTrigger value="map" className="rounded-lg px-4">Map View</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="list" className="m-0 mt-4 focus-visible:outline-none focus-visible:ring-0">
            <AdminReportsTable reports={reports} isLoading={isLoading} onRefresh={fetchDashboardData} />
          </TabsContent>
          
          <TabsContent value="map" className="m-0 mt-4 focus-visible:outline-none focus-visible:ring-0">
            <div className="h-[500px] w-full rounded-xl overflow-hidden border border-border/50 relative z-0">
              <Map markers={mapMarkers} className="h-full w-full" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient }: { title: string; value: number; icon: any; gradient: string }) {
  return (
    <Card className={`relative overflow-hidden bg-gradient-to-r ${gradient} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start">
          <p className="text-white/90 font-medium tracking-wide">{title}</p>
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-sm ring-1 ring-white/20">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-4xl font-bold tracking-tight">{value}</p>
      </div>
      
      {/* Decorative background effects */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>
    </Card>
  );
}
