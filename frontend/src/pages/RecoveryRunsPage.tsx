import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Filter, ChevronRight, AlertTriangle } from 'lucide-react';

interface RevenueRunRecord {
  event_id: string;
  event_type: string;
  amount: number;
  currency: string;
  amount_in_inr: number;
  timestamp: string;
  payment_method: string;
  customer_segment: string;
  country: string;
  is_cross_border: boolean;
  previous_recovery_attempts: number;
  root_cause: string;
  confidence: number;
  recoverability: string;
  decision: string;
  eligible_for_recovery: boolean;
  selected_intervention: string;
  timing: string;
  priority_score: number;
  attempt_id: string;
  execution_status: string;
  outcome: string;
  simulated_amount_recovered: number;
  executed_at: string;
}

interface RecoveryRunsPageProps {
  onViewRun: (eventId: string) => void;
}

export const RecoveryRunsPage: React.FC<RecoveryRunsPageProps> = ({ onViewRun }) => {
  const [runs, setRuns] = useState<RevenueRunRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Sorting States
  const [sortField, setSortField] = useState<keyof RevenueRunRecord>('event_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let active = true;
    const fetchRuns = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/recovery/runs`);
        if (!response.ok) {
          throw new Error('Failed to fetch recovery runs.');
        }
        const data = await response.json();
        if (active) {
          setRuns(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Unknown network error');
          setLoading(false);
        }
      }
    };

    fetchRuns();
    return () => { active = false; };
  }, []);

  const handleSort = (field: keyof RevenueRunRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Sort runs calculation
  const filteredRuns = runs.filter(run => {
    if (decisionFilter !== 'all' && run.decision !== decisionFilter) return false;
    if (outcomeFilter !== 'all' && run.outcome !== outcomeFilter) return false;
    if (typeFilter !== 'all' && run.event_type !== typeFilter) return false;
    return true;
  });

  const sortedRuns = [...filteredRuns].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'timestamp') {
      valA = new Date(a.timestamp).getTime();
      valB = new Date(b.timestamp).getTime();
    }

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
        <span className="text-secondaryText text-sm font-semibold">Loading Recovery Runs Database...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Runs</h3>
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

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans">
          Recovery Runs
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Track individual execution outcomes, simulated retry status, and scheduled interventions.
        </p>
      </div>

      {/* Runs Table Card */}
      <div className="bg-white rounded-4xl shadow-card border border-slate-100/30 overflow-hidden">
        {/* Filters Header */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-primaryText font-bold text-sm">
            <Filter className="w-4 h-4 text-brandActive" />
            Filters
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Event Types</option>
              <option value="failed_payment">Failed Payment</option>
              <option value="failed_subscription">Failed Subscription</option>
              <option value="abandoned_checkout">Abandoned Checkout</option>
              <option value="overdue_invoice">Overdue Invoice</option>
            </select>

            <select 
              value={decisionFilter} 
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Decisions</option>
              <option value="recover">Recover</option>
              <option value="stop">Stop</option>
              <option value="review">Review</option>
            </select>

            <select 
              value={outcomeFilter} 
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-secondaryText uppercase tracking-wider">
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('event_id')}>
                  <div className="flex items-center gap-1.5">Event ID <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6">Event Type</th>
                <th className="py-4 px-6">Decision</th>
                <th className="py-4 px-6">Intervention</th>
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('amount_in_inr')}>
                  <div className="flex items-center gap-1.5">Amount (INR) <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6">Simulated Recovered</th>
                <th className="py-4 px-6">Outcome</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] font-medium text-slate-700">
              {sortedRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-secondaryText text-sm font-semibold">
                    No runs match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedRuns.map((run) => (
                  <tr 
                    key={run.event_id} 
                    className="hover:bg-slate-50/70 transition-colors duration-150 cursor-pointer"
                    onClick={() => onViewRun(run.event_id)}
                  >
                    <td className="py-4.5 px-6 font-bold text-primaryText">{run.event_id}</td>
                    <td className="py-4.5 px-6 capitalize">{run.event_type.replace('_', ' ')}</td>
                    <td className="py-4.5 px-6">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                        ${run.decision === 'recover' ? 'bg-emerald-50 text-emerald-600' : ''}
                        ${run.decision === 'stop' ? 'bg-rose-50 text-rose-600' : ''}
                        ${run.decision === 'review' ? 'bg-indigo-50 text-indigo-600' : ''}
                      `}>
                        {run.decision}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 capitalize text-secondaryText/90">{run.selected_intervention.replace('_', ' ')}</td>
                    <td className="py-4.5 px-6 font-bold text-primaryText">
                      ₹{run.amount_in_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4.5 px-6">
                      {run.outcome === 'success' ? (
                        <div>
                          <span className="font-extrabold text-emerald-500">
                            ₹{run.amount_in_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] text-emerald-500/80 font-bold block">SIMULATED</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">-</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${run.outcome === 'success' ? 'bg-emerald-50 text-emerald-600' : ''}
                        ${run.outcome === 'failed' ? 'bg-rose-50 text-rose-600' : ''}
                        ${run.outcome === 'skipped' ? 'bg-slate-100 text-slate-500' : ''}
                        ${run.outcome === 'blocked' ? 'bg-indigo-50 text-indigo-600' : ''}
                      `}>
                        {run.outcome}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onViewRun(run.event_id)}
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
