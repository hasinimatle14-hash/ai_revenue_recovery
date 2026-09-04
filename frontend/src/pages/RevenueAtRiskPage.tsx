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
  outcome: string;
}

interface RevenueAtRiskPageProps {
  onViewRun: (eventId: string) => void;
}

export const RevenueAtRiskPage: React.FC<RevenueAtRiskPageProps> = ({ onViewRun }) => {
  const [runs, setRuns] = useState<RevenueRunRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [rootCauseFilter, setRootCauseFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [geoFilter, setGeoFilter] = useState<string>('all');

  // Sorting States
  const [sortField, setSortField] = useState<keyof RevenueRunRecord>('priority_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let active = true;
    const fetchRuns = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/recovery/runs`);
        if (!response.ok) {
          throw new Error('Failed to fetch revenue-at-risk dataset.');
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
      setSortDirection('desc');
    }
  };

  // Helper to resolve priority label
  const getPriorityLabel = (score: number) => {
    if (score >= 0.7) return 'High';
    if (score >= 0.3) return 'Medium';
    return 'Low';
  };

  // Filtered & Sorted runs calculation
  const filteredRuns = runs.filter(run => {
    if (eventTypeFilter !== 'all' && run.event_type !== eventTypeFilter) return false;
    if (rootCauseFilter !== 'all' && run.root_cause !== rootCauseFilter) return false;
    if (geoFilter !== 'all') {
      const isCross = geoFilter === 'cross-border';
      if (run.is_cross_border !== isCross) return false;
    }
    if (priorityFilter !== 'all') {
      const label = getPriorityLabel(run.priority_score).toLowerCase();
      if (label !== priorityFilter) return false;
    }
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

  // Calculate totals from entire run pool
  const totalRevenueAtRisk = runs.reduce((sum, r) => sum + r.amount_in_inr, 0);
  const highPriorityCount = runs.filter(r => r.priority_score >= 0.7).length;
  const recoverableCount = runs.filter(r => r.eligible_for_recovery).length;
  const stoppedCount = runs.filter(r => r.decision === 'stop').length;
  const blockedCount = runs.filter(r => r.outcome === 'blocked').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Loading Revenue-at-Risk Dataset...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Ingest Dataset</h3>
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
          Revenue at Risk
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Monitor transactional failures, customer values, and automated recovery eligibility constraints.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Total Revenue at Risk</span>
          <h3 className="text-2xl font-extrabold text-primaryText mt-2">
            ₹{totalRevenueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Sum of all transaction values</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">High Priority Events</span>
          <h3 className="text-2xl font-extrabold text-primaryText mt-2">{highPriorityCount}</h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Priority score ≥ 0.70</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Recoverable Events</span>
          <h3 className="text-2xl font-extrabold text-emerald-500 mt-2">{recoverableCount}</h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Eligible under system rules</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Stopped / Blocked</span>
          <h3 className="text-2xl font-extrabold text-rose-500 mt-2">{stoppedCount + blockedCount}</h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">
            {stoppedCount} stopped, {blockedCount} review pending
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-4xl shadow-card border border-slate-100/30 overflow-hidden">
        {/* Filters Header */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-primaryText font-bold text-sm">
            <Filter className="w-4 h-4 text-brandActive" />
            Filters
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              value={eventTypeFilter} 
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Types</option>
              <option value="failed_payment">Failed Payment</option>
              <option value="failed_subscription">Failed Subscription</option>
              <option value="abandoned_checkout">Abandoned Checkout</option>
              <option value="overdue_invoice">Overdue Invoice</option>
            </select>

            <select 
              value={rootCauseFilter} 
              onChange={(e) => setRootCauseFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Root Causes</option>
              <option value="insufficient_funds">Insufficient Funds</option>
              <option value="expired_or_invalid_payment_method">Expired Payment Method</option>
              <option value="issuer_risk_flag">Issuer Risk Flag</option>
              <option value="checkout_friction">Checkout Friction</option>
              <option value="technical_failure">Technical Failure</option>
              <option value="genuine_non_payment_intent">Genuine Non-Payment</option>
            </select>

            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select 
              value={geoFilter} 
              onChange={(e) => setGeoFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 focus:outline-none focus:border-brandActive"
            >
              <option value="all">All corridors</option>
              <option value="domestic">Domestic</option>
              <option value="cross-border">Cross-Border</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-secondaryText uppercase tracking-wider">
                <th className="py-4 px-6">Event ID</th>
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center gap-1.5">Timestamp <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6">Event Type</th>
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('amount_in_inr')}>
                  <div className="flex items-center gap-1.5">Amount (INR) <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6">Root Cause</th>
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('confidence')}>
                  <div className="flex items-center gap-1.5">Confidence <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => handleSort('priority_score')}>
                  <div className="flex items-center gap-1.5">Priority <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] font-medium text-slate-700">
              {sortedRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-secondaryText text-sm font-semibold">
                    No events match the selected filters.
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
                    <td className="py-4.5 px-6 text-secondaryText">
                      {new Date(run.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-4.5 px-6 capitalize">{run.event_type.replace('_', ' ')}</td>
                    <td className="py-4.5 px-6 font-bold text-primaryText">
                      ₹{run.amount_in_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      {run.is_cross_border && (
                        <span className="text-[10px] text-brandActive block font-medium mt-0.5">
                          ({run.amount.toLocaleString()} {run.currency})
                        </span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 capitalize">{run.root_cause.replace('_', ' ')}</td>
                    <td className="py-4.5 px-6 font-bold text-primaryText">{Math.round(run.confidence * 100)}%</td>
                    <td className="py-4.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${run.priority_score >= 0.7 ? 'bg-rose-50 text-rose-600' : ''}
                        ${run.priority_score >= 0.3 && run.priority_score < 0.7 ? 'bg-amber-50 text-amber-600' : ''}
                        ${run.priority_score < 0.3 ? 'bg-slate-50 text-slate-500' : ''}
                      `}>
                        {getPriorityLabel(run.priority_score)} ({run.priority_score.toFixed(2)})
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
