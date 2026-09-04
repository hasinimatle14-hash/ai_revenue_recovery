import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';

interface AnomalyRecord {
  anomaly_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  description: string;
  affected_count: number;
  affected_events: string[];
  recommended_action: string;
  detected_at: string;
}

export const AnomaliesPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAnomalies = async () => {
    try {
      let url = 'http://localhost:8000/api/anomalies';
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load operational anomalies data.');
      }
      const data = await response.json();
      setAnomalies(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Network error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [severityFilter, statusFilter]);

  if (loading && anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Scanning operational logs for anomalies...</span>
      </div>
    );
  }

  if (error && anomalies.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Anomalies</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          Operational Anomalies Dashboard
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Surfaces operational spikes, intervention imbalances, excessive stop decisions, and rate degradation anomalies.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100/50 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filters:</span>
        </div>

        <div className="flex gap-4 items-center">
          {/* Severity filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondaryText font-medium">Severity:</span>
            <select 
              value={severityFilter} 
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondaryText font-medium">Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-secondaryText text-sm font-semibold border border-slate-100">
            No operational anomalies found matching the selected filters.
          </div>
        ) : (
          anomalies.map((anm) => (
            <div key={anm.anomaly_id} className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{anm.anomaly_id}</span>
                  <h3 className="font-extrabold text-base text-primaryText capitalize">{anm.type.replace(/_/g, ' ')}</h3>
                </div>

                <div className="flex gap-2 items-center">
                  {/* Severity badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${anm.severity === 'critical' ? 'bg-red-100 text-red-700' : ''}
                    ${anm.severity === 'high' ? 'bg-rose-50 text-rose-600' : ''}
                    ${anm.severity === 'medium' ? 'bg-amber-50 text-amber-600' : ''}
                    ${anm.severity === 'low' ? 'bg-slate-100 text-slate-600' : ''}
                  `}>
                    {anm.severity} Severity
                  </span>

                  {/* Status badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${anm.status === 'open' ? 'bg-amber-50 text-amber-600 border border-amber-200' : ''}
                    ${anm.status === 'acknowledged' ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}
                    ${anm.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ''}
                  `}>
                    {anm.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                {anm.description}
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-700">
                <span className="text-[10px] text-secondaryText font-bold uppercase tracking-wider block mb-1">Recommended Remediation Action</span>
                {anm.recommended_action}
              </div>

              <div className="text-[11px] text-slate-400 font-bold flex justify-between pt-2">
                <span>Affected Events ({anm.affected_count}): {anm.affected_events.slice(0, 5).join(', ')}...</span>
                <span>Detected at: {new Date(anm.detected_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
