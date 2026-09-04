import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Check, X, ShieldAlert as AlertIcon, ChevronRight } from 'lucide-react';

interface HumanReviewRecord {
  review_id: string;
  event_id: string;
  agent_run_id: string;
  proposed_action: string;
  risk_level: string;
  agent_confidence: number;
  review_status: string;
  review_reason: string;
  human_decision: string | null;
  final_action: string | null;
  reviewed_by: string | null;
}

interface AgentReviewQueuePageProps {
  onViewDetails?: (reviewId: string) => void;
}

export const AgentReviewQueuePage: React.FC<AgentReviewQueuePageProps> = ({ onViewDetails }) => {
  const [queue, setQueue] = useState<HumanReviewRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchQueue = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`);
      if (!response.ok) {
        throw new Error('Failed to load persistent review queue.');
      }
      const data = await response.json();
      // Filter pending reviews
      const pendingReviews = data.filter((r: HumanReviewRecord) => r.review_status === 'pending');
      setQueue(pendingReviews);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unknown network error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (reviewId: string, eventId: string, isApprove: boolean) => {
    setLoading(true);
    const decision = isApprove ? 'approve' : 'reject';
    const reason = isApprove 
      ? 'Approved simulated retry after manual review.' 
      : 'Rejected: Overrides suggest elevated risk margins.';
      
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reason,
          reviewed_by: 'merchant'
        })
      });
      
      const resData = await response.json();
      
      if (!response.ok) {
        // Safe override trigger or conflict
        const errMsg = resData.detail || 'Manual approval rejected.';
        setNotification({
          type: 'error',
          message: `Blocked: ${errMsg}`
        });
        setLoading(false);
        return;
      }
      
      setNotification({
        type: 'success',
        message: `Simulated decision successfully stored: ${eventId} status set to ${resData.review_status.toUpperCase()}.`
      });
      
      // Refresh list
      await fetchQueue();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Network connection failed.'
      });
      setLoading(false);
    }
  };

  if (loading && queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Gleaning persistent review queue...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Ingest Queue</h3>
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
        <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-brandActive" />
          Human-in-the-Loop Review Queue
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Inspect context, review AI agent recommendations, and approve or reject simulated runs.
        </p>
      </div>

      {/* Safety Compliance Note Banner */}
      <div className="bg-indigo-50 border border-indigo-150 rounded-3xl p-5 flex items-start gap-4 relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-brandActive/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
        <AlertIcon className="w-5.5 h-5.5 text-brandActive shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-brandActive text-sm uppercase tracking-wider">Simulated Compliance Environment</h4>
          <p className="text-slate-650 text-xs mt-1 font-semibold leading-relaxed">
            SIMULATED INTERVENTION ENV — NO REAL PAYMENT ATTEMPTS OR CASH TRANSACTION MOVEMENT OCCUR. Actions update persistent audit records and mock outcomes locally.
          </p>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-sm animate-pulse
          ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-250 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}
        `}>
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Review Queue Table Card */}
      <div className="bg-white rounded-4xl shadow-card border border-slate-100/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-secondaryText uppercase tracking-wider">
                <th className="py-4 px-6">Review ID</th>
                <th className="py-4 px-6">Event ID</th>
                <th className="py-4 px-6">Proposed Action</th>
                <th className="py-4 px-6">Risk Assessment</th>
                <th className="py-4 px-6">Agent Confidence</th>
                <th className="py-4 px-6">Intervention Reason</th>
                <th className="py-4 px-6 text-center">Simulated Resolution Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] font-medium text-slate-700">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-secondaryText text-sm font-semibold">
                    No transactions currently in the review queue. All policy overrides resolved.
                  </td>
                </tr>
              ) : (
                queue.map((r) => (
                  <tr 
                    key={r.review_id} 
                    className="hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer"
                    onClick={() => onViewDetails && onViewDetails(r.review_id)}
                  >
                    <td className="py-4.5 px-6 font-bold text-primaryText">{r.review_id}</td>
                    <td className="py-4.5 px-6 font-bold text-slate-500">{r.event_id}</td>
                    <td className="py-4.5 px-6 capitalize">{r.proposed_action.replace(/_/g, ' ')}</td>
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
                    <td className="py-4.5 px-6 font-bold text-primaryText">{Math.round(r.agent_confidence * 100)}%</td>
                    <td className="py-4.5 px-6 text-slate-650 leading-relaxed font-semibold">{r.review_reason}</td>
                    <td className="py-4.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-center items-center">
                        <button 
                          onClick={() => handleAction(r.review_id, r.event_id, true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-100"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(r.review_id, r.event_id, false)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-100"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button 
                          onClick={() => onViewDetails && onViewDetails(r.review_id)}
                          className="p-1.5 text-secondaryText hover:text-brandActive transition-colors"
                          title="View review context"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
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
