'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapMarker } from '@/components/ui/leaflet-map';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const Map = dynamic(() => import('@/components/ui/leaflet-map').then(m => m.LeafletMap), {
  ssr: false,
});

export default function WorkerDashboard() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();

  // For the resolution modal/form
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);
      console.log('Worker dashboard loaded. Current Worker ID:', user.id);

      // Fetch reports assigned to me
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('assigned_worker_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Fetched Assigned Tasks:', data);
      console.log('Fetch error (if any):', error);

      if (error) {
        throw error;
      }

      // Filter out resolved tasks if you don't want them actively shown as to-do, 
      // but the user just requested "Worker should fetch ONLY their assigned tasks"
      const activeTasks = (data || []).filter((t: any) => t.status !== 'resolved');

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !userId) return;

    setIsResolving(true);
    try {
      let imageUrl = null;

      // 0. Upload Image if provided
      if (resolutionFile) {
        const filePath = `resolutions/${Date.now()}-${resolutionFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(filePath, resolutionFile);

        if (uploadError) throw uploadError;

        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reports/${uploadData.path}`;
      }

      // 1. Insert update record
      const { error: updateError } = await supabase.from('updates').insert({
        report_id: selectedTask.id,
        worker_id: userId,
        note: resolutionNote,
        after_image_url: imageUrl
      });

      if (updateError) throw updateError;

      // 2. Update report status to resolved
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', selectedTask.id);

      if (reportError) throw reportError;

      // Refresh list
      setSelectedTask(null);
      setResolutionNote('');
      setResolutionFile(null);
      fetchTasks();
      alert('Task marked as completed!');
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleStartWork = async (taskId: string) => {
    if (!userId) return;
    try {
      console.log("Attempting to start task:", taskId, "for user:", userId);
      const { data, error } = await supabase
        .from('reports')
        .update({ status: 'in_progress' })
        .eq('id', taskId)
        .eq('assigned_worker_id', userId)
        .select();
        
      if (error) {
        console.error("Supabase explicit error:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error("Zero rows updated. Possible RLS block or ID mismatch.");
        alert("Data Error: No task was updated. This is usually caused by Supabase Row-Level Security (RLS) blocking the write, or the task mismatching your Worker ID.");
        return;
      }
      
      fetchTasks();
      alert('Work started successfully!');
    } catch (error: any) {
      console.error('Error starting task:', error);
      alert(`Failed to start task. Reason: ${error?.message || JSON.stringify(error)}`);
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

  const mapMarkers: MapMarker[] = tasks
    .filter((t) => t.lat && t.lng)
    .map((t) => ({
      id: t.id,
      lat: t.lat,
      lng: t.lng,
      category: t.category,
      severity: t.severity,
      popupContent: (
        <div className="text-sm">
          <p className="font-bold">{getCategoryIcon(t.category)} {t.category}</p>
          <p className="text-muted-foreground mt-1 max-w-[200px] truncate">{t.summary}</p>
        </div>
      )
    }));

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#22D3EE] rounded-3xl p-8 text-white shadow-[0_10px_40px_rgba(37,99,235,0.3)] relative overflow-hidden mb-8">
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Assigned Tasks</h2>
          <p className="text-white/90 text-lg">View, manage, and resolve civic issues assigned to you.</p>
        </div>
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Task List */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-[#22D3EE] mb-6">Active Assignments</h3>
          {isLoading ? (
            <p className="text-gray-400">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="p-6 bg-[#1F2937]/80 backdrop-blur-md text-white rounded-2xl shadow-lg border border-white/10 text-center">
              You have no active tasks.
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-5 bg-[#1F2937]/80 backdrop-blur-md text-white rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.05)] border border-white/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-300 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg capitalize flex items-center gap-2 text-white">
                      <span className="p-1.5 bg-[#0A192F] rounded-lg text-xl hover:scale-110 transition">{getCategoryIcon(task.category)}</span> 
                      {task.category}
                      {task.priority && (
                         <span className={`text-[10px] ml-2 px-2 py-0.5 rounded-full border uppercase tracking-wider font-extrabold shadow-sm ${
                           task.priority === 'high' ? 'bg-red-500/20 text-red-500 border-red-500/50' :
                           task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                           'bg-green-500/20 text-green-400 border-green-500/50'
                         }`}>
                           {task.priority} Priority
                         </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-400 mt-2 max-w-md">{task.summary || 'Location reported on map.'}</p>
                    
                    <div className="flex flex-col gap-1 mt-3">
                       <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                          📍 Lat: {task.lat?.toFixed(4)}, Lng: {task.lng?.toFixed(4)}
                       </p>
                       <p className="text-xs text-gray-400">
                          🗓️ Scheduled: <span className="font-medium text-white">{task.scheduled_at ? new Date(task.scheduled_at).toLocaleDateString() : "Not set"}</span>
                       </p>
                       <p className="text-xs text-gray-400">
                          ⏱️ ETA: <span className="font-medium text-[#22D3EE]">{task.estimated_time || "Not set"}</span>
                       </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm capitalize ${
                    task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                    task.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                    'bg-blue-500/20 text-[#22D3EE] border border-[#22D3EE]/50'
                  }`}>
                    {task.status}
                  </span>
                </div>
                
                {selectedTask?.id === task.id ? (
                  <form onSubmit={handleResolve} className="mt-4 p-4 bg-[#0A192F] rounded-xl space-y-4 border border-[#22D3EE]/20 shadow-inner">
                    <h5 className="font-bold text-[#22D3EE] text-sm">Resolve Issue</h5>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-300">Completion Note</label>
                      <textarea
                        required
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                        className="w-full text-sm rounded-md border border-white/10 p-3 bg-[#1F2937] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition"
                        placeholder="What was done?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-300">Upload Photo Proof (Optional)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setResolutionFile(e.target.files?.[0] || null)}
                        className="text-xs w-full file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2563EB]/20 file:text-[#22D3EE] hover:file:bg-[#2563EB]/40 cursor-pointer text-gray-400"
                      />
                    </div>
                    <div className="flex gap-3 justify-end mt-2">
                      <Button variant="outline" size="sm" type="button" onClick={() => { setSelectedTask(null); setResolutionFile(null); }} className="border-gray-500 text-gray-300 hover:bg-gray-800">
                        Cancel
                      </Button>
                      <Button size="sm" type="submit" disabled={isResolving} className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold border border-blue-600/50">
                        {isResolving ? 'Completing...' : 'Mark Complete'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 mt-2 border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center w-full">
                       <p className="text-sm font-semibold text-gray-400">Severity: <span className="text-[#22D3EE] font-bold">{task.severity}/5</span></p>
                    </div>
                    <div className="flex gap-3 w-full">
                      {task.status === 'assigned' && (
                        <Button size="sm" variant="outline" className="flex-1 bg-[#1F2937] border-[#2563EB] text-[#22D3EE] hover:bg-[#2563EB]/10 font-bold hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition" onClick={() => handleStartWork(task.id)}>
                          Start Work
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm" variant="default" className="flex-1 bg-gradient-to-r from-[#2563EB] to-[#22D3EE] hover:opacity-90 text-white font-bold shadow-md hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition" onClick={() => setSelectedTask(task)}>
                          Resolve Task
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Map View */}
        <div className="space-y-4 sticky top-6">
          <div className="mb-2">
            <h3 className="text-xl font-bold text-white">Task Locations</h3>
            <p className="text-gray-400 text-sm">View where your issues are plotted</p>
          </div>
          <div className="h-[600px] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-0 bg-[#0A192F]">
            <Map markers={mapMarkers} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
