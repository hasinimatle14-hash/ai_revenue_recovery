import React, { useState, useEffect } from 'react';
import { Cpu, ArrowUpDown, Filter, ChevronRight, AlertTriangle, ShieldAlert } from 'lucide-react';

interface AgentRunRecord {
  agent_run_id: string;
  event_id: string;
  diagnosis_id: string;
  decision_id: string;
  recommended_action: string;
  risk_level: string;
  confidence: number;
  requires_human_review: boolean;
  human_review_reason: string | null;
  reasoning: string;
  next_state: string;
}

interface RecoveryAgentPageProps {
  onViewRun: (eventId: string) => void;
  onViewQueue: () => void;
}

export const RecoveryAgentPage: React.FC<RecoveryAgentPageProps> = ({ onViewRun, onViewQueue }) => {
  const [runs, setRuns] = useState<AgentRunRecord[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');

  // Sorting States
  const [sortField, setSortField] = useState<keyof AgentRunRecord>('event_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let active = true;
    const fetchAgentData = async () => {
      try {
        const resRuns = await fetch('http://localhost:8000/api/agent/runs');
        const resStatus = await fetch('http://localhost:8000/api/agent/status');
        if (!resRuns.ok || !resStatus.ok) {
          throw new Error('Failed to fetch AI Recovery Agent datasets.');
        }
        const dataRuns = await resRuns.json();
        const dataStatus = await resStatus.json();
        
        if (active) {
          setRuns(dataRuns);
          setStatus(dataStatus);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Unknown network error');
          setLoading(false);
        }
      }
    };

    fetchAgentData();
    return () => { active = false; };
  }, []);

  const handleSort = (field: keyof AgentRunRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Sort calculation
  const filteredRuns = runs.filter(r => {
    if (actionFilter !== 'all' && r.recommended_action !== actionFilter) return false;
    if (riskFilter !== 'all' && r.risk_level !== riskFilter) return false;
    if (reviewFilter !== 'all') {
      const isReview = reviewFilter === 'true';
      if (r.requires_human_review !== isReview) return false;
    }
    return true;
  });

  const sortedRuns = [...filteredRuns].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortDirection === 'asc' 
        ? (valA as string).localeCompare(valB as string)
        : (valB as string).localeCompare(valA as string);
    } else {
      return sortDirection === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Gleaning AI Agent decisions...</span>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Agent Database Offline</h3>
          <p className="text-red-700 text-sm mt-1 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 font-bold text-xs rounded-xl hover:bg-red-200 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const automatedCount = status.events_processed - status.human_review_queue;

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
            <Cpu className="w-8 h-8 text-brandActive" />
            AI Recovery Agent
          </h1>
          <p className="text-secondaryText text-sm mt-1.5 font-medium">
            Intelligent orchestration layer analyzing policy overrides, confidence triggers, and risks.
          </p>
        </div>
        <div>
          <button 
            onClick={onViewQueue}
            className="flex items-center gap-2 px-5 py-2.5 bg-brandActive text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 duration-300"
          >
            <ShieldAlert className="w-4 h-4" />
            View Review Queue ({status.human_review_queue})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Events Evaluated</span>
          <h3 className="text-2xl font-extrabold text-primaryText mt-2">{status.events_processed}</h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">100% database coverage</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Automated Recommendations</span>
          <h3 className="text-2xl font-extrabold text-emerald-500 mt-2">{automatedCount}</h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Approved for simulation rails</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Human Review Required</span>
          <h3 className="text-2xl font-extrabold text-indigo-500 mt-2">{status.human_review_queue}</h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Policy overrides applied</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Avg Agent Confidence</span>
          <h3 className="text-2xl font-extrabold text-primaryText mt-2">
            {Math.round(status.average_confidence * 100)}%
          </h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Confidence clamped 0.0 - 1.0</p>
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-white rounded-4xl shadow-card border border-slate-100/30 overflow-hidden">
        {/* Filters Header */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-primaryText font-bold text-sm">
            <Filter className="w-4 h-4 text-brandActive" />
            Agent Activity Filters
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Actions</option>
              <option value="proceed_with_simulation">Proceed Simulation</option>
              <option value="delay_and_retry">Delay & Retry</option>
              <option value="request_payment_method_update">Request Update</option>
              <option value="manual_review">Manual Review</option>
              <option value="stop">Stop</option>
            </select>

            <select 
              value={riskFilter} 
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select 
              value={reviewFilter} 
              onChange={(e) => setReviewFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Channels</option>
              <option value="true">Human Review</option>
              <option value="false">Automated</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-secondaryText uppercase tracking-wider">
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('event_id')}>
                  <div className="flex items-center gap-1.5">Event ID <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6">Recommended Action</th>
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('risk_level')}>
                  <div className="flex items-center gap-1.5">Risk Level <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('confidence')}>
                  <div className="flex items-center gap-1.5">Confidence <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6">Routing</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] font-medium text-slate-700">
              {sortedRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-secondaryText text-sm font-semibold">
                    No agent runs match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedRuns.map((r) => (
                  <tr 
                    key={r.event_id} 
                    className="hover:bg-slate-50/70 transition-colors duration-150 cursor-pointer"
                    onClick={() => onViewRun(r.event_id)}
                  >
                    <td className="py-4.5 px-6 font-bold text-primaryText">{r.event_id}</td>
                    <td className="py-4.5 px-6 capitalize">{r.recommended_action.replace(/_/g, ' ')}</td>
                    <td className="py-4.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${r.risk_level === 'critical' ? 'bg-red-100 text-red-700' : ''}
                        ${r.risk_level === 'high' ? 'bg-rose-50 text-rose-600' : ''}
                        ${r.risk_level === 'medium' ? 'bg-amber-50 text-amber-600' : ''}
                        ${r.risk_level === 'low' ? 'bg-slate-50 text-slate-500' : ''}
                      `}>
                        {r.risk_level}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 font-bold text-primaryText">{Math.round(r.confidence * 100)}%</td>
                    <td className="py-4.5 px-6">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                        ${r.requires_human_review ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}
                      `}>
                        {r.requires_human_review ? 'Human Review' : 'Automated'}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onViewRun(r.event_id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brandActive hover:text-brandActive/80 transition-colors bg-brandActive/[0.04] px-3.5 py-1.5 rounded-xl"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
