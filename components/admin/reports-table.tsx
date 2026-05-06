'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Report {
  id: string;
  category: string;
  severity: number;
  summary: string;
  status: string;
  created_at: string;
  user_id: string;
  assigned_worker_id?: string;
  image_url?: string;
  scheduled_at?: string;
}

export default function AdminReportsTable({
  reports,
  isLoading,
  onRefresh,
}: {
  reports: Report[];
  isLoading: boolean;
  onRefresh: () => void;
  }) {
  const supabase = createClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<{id: string, name?: string}[]>([]);

  useEffect(() => {
    // Fetch workers for dropdown
    const fetchWorkers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'worker');
          
        if (error) {
          throw error;
        }
        if (data) {
          setWorkers(data);
        }
      } catch (err) {
        console.error('Error fetching workers:', err);
      }
    };
    fetchWorkers();
  }, [supabase]);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      pothole: '🕳️',
      streetlight: '💡',
      graffiti: '🎨',
      debris: '🗑️',
      other: '📍',
    };
    return icons[category] || '📍';
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return 'bg-green-100 text-green-800';
    if (severity <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    setUpdatingId(reportId);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWorkerAssignment = async (reportId: string, workerId: string, scheduledDate?: string) => {
    console.log("Assigning worker:", workerId, "to report:", reportId);
    setUpdatingId(reportId);
    try {
      const updates: any = { 
        assigned_worker_id: workerId === '' ? null : workerId
      };
      if (scheduledDate) {
        updates.scheduled_at = new Date(scheduledDate).toISOString();
      }
      
      // Auto-update status to assigned if giving to a worker and currently pending
      if (workerId !== '') {
        updates.status = 'assigned';
      }
      
      console.log("Payload to DB:", updates);
      
      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId)
        .select('*');

      console.log("DB Update Result:", data, "Error:", error);
      
      if (error) throw error;
      onRefresh();
      alert('Task Assigned & Scheduled successfully!');
    } catch (error) {
      console.error('Error assigning worker:', error);
      alert('Error updating DB. Please check your SQL / RLS policies!');
    } finally {
      setUpdatingId(null);
    }
  }

  const [dateInputState, setDateInputState] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">No reports yet</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Image</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Category</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Summary</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Severity</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Assign To Worker</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="py-3 px-4">
                {report.image_url ? (
                  <a href={report.image_url} target="_blank" rel="noopener noreferrer" className="block relative h-12 w-12 group">
                    <img
                      src={report.image_url}
                      alt="Report item"
                      className="w-full h-full object-cover rounded shadow-sm border border-border group-hover:scale-110 transition-transform cursor-pointer"
                    />
                  </a>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border border-border text-xs text-muted-foreground text-center p-1">
                    None
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="text-2xl">{getCategoryIcon(report.category)}</span>
                <span className="ml-2 capitalize text-sm">{report.category}</span>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-foreground max-w-xs truncate">{report.summary}</p>
              </td>
              <td className="py-3 px-4">
                <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(report.severity)}`}>
                  {report.severity}/5
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col gap-2 relative">
                  <select
                    value={report.assigned_worker_id || ''}
                    onChange={(e) => {
                      console.log("Assign button clicked", report.id, e.target.value);
                      handleWorkerAssignment(report.id, e.target.value, dateInputState[report.id]);
                    }}
                    disabled={updatingId === report.id}
                    className="text-xs px-2 py-1 max-w-[140px] truncate bg-background border border-border rounded cursor-pointer font-medium hover:border-primary transition"
                  >
                    <option value="">Unassigned</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>Worker {w.id.substring(0, 4)}</option>
                    ))}
                  </select>
                  
                  {report.assigned_worker_id && (
                     <div className="text-xs">
                       <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">Schedule Time</label>
                       <input 
                         type="datetime-local" 
                         value={dateInputState[report.id] || (report.scheduled_at ? new Date(new Date(report.scheduled_at).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '')}
                         onChange={(e) => setDateInputState(prev => ({...prev, [report.id]: e.target.value}))}
                         onBlur={(e) => {
                           if (e.target.value) handleWorkerAssignment(report.id, report.assigned_worker_id!, e.target.value);
                         }}
                         disabled={updatingId === report.id}
                         className="text-xs px-2 py-1 w-[140px] border border-border rounded bg-background focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                       />
                       <p className="text-[9px] text-gray-500 mt-1">Changes auto-save</p>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 flex items-center gap-2">
                <select
                  value={report.status}
                  onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                  disabled={updatingId === report.id}
                  className="text-xs px-2 py-1 bg-background border border-border rounded cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
