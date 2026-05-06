'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ReportsList from '@/components/citizen/reports-list';
import ReportForm from '@/components/citizen/report-form';
import Leaderboard from '@/components/citizen/leaderboard';

export default function CitizenDashboard() {
  const supabase = createClient();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserAndReports();
  }, []);

  const fetchUserAndReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      
      {/* Top Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">Report issues instantly. Improve your city.</h1>
          <p className="text-white/80 text-lg max-w-xl">Take a photo, drop a pin, and let us handle the rest. Track community progress and help us build a better environment together.</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column (1/3): Stats, Tips, Leaderboard */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-md dark:bg-gray-900/70 rounded-3xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
            <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
              <span className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">🌍</span>
              Community Impact
            </h3>
            <p className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">{reports.length}</p>
            <p className="text-sm text-foreground/70 font-medium mt-1">Total Issues Reported</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md dark:bg-gray-900/70 rounded-3xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
              <span className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">💡</span> 
              Reporting Tips
            </h3>
            <ul className="text-sm space-y-4 text-muted-foreground">
              <li className="flex gap-3 items-start">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">Upload a clear image of the issue to automatically detect its category and severity.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">Pin the exact location on the map for quick worker dispatch.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">Wait for workers to resolve the issue and track its status below.</span>
              </li>
            </ul>
          </div>
          
          <Leaderboard />
        </div>

        {/* Right Column (2/3): Report Form & List */}
        <div className="col-span-1 md:col-span-2 space-y-8">
          <ReportForm onReportSubmitted={fetchUserAndReports} />
          
          <div className="bg-white/80 backdrop-blur-md dark:bg-gray-900/70 rounded-3xl shadow-lg border border-white/20 p-6 transition duration-300 hover:shadow-xl">
             <h2 className="text-2xl font-bold text-foreground mb-6 tracking-tight flex items-center gap-2">
               <span className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">📋</span>
               Recent Reports
             </h2>
             <ReportsList reports={reports} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
