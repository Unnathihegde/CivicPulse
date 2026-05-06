'use client';

import { Card } from '@/components/ui/card';

interface Report {
  id: string;
  category: string;
  severity: number;
  summary: string;
  status: string;
  created_at: string;
  user_id: string;
}

export default function ReportsList({
  reports,
  isLoading,
}: {
  reports: Report[];
  isLoading: boolean;
}) {
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

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No reports yet. Be the first to report an issue!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <span className="text-2xl">{getCategoryIcon(report.category)}</span>
              <div>
                <h3 className="font-semibold text-foreground capitalize">
                  {report.category}
                </h3>
                <p className="text-sm text-muted-foreground">{report.summary}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded font-semibold capitalize ${getStatusColor(report.status)}`}>
              {report.status}
            </span>
          </div>
          
          {report.status === 'resolved' && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-md text-sm font-medium flex items-center gap-2 mt-2 border border-green-200 dark:border-green-800/50">
              👉 Your issue has been resolved ✅
            </div>
          )}
          
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-2 border-t border-border">
            <span className="font-medium">Severity: <span className="text-foreground">{report.severity}/5</span></span>
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
