import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';

interface HumanReviewRecord {
  review_id: string;
  event_id: string;
  agent_run_id: string;
  diagnosis_id: string;
  decision_id: string;
  proposed_action: string;
  risk_level: string;
  agent_confidence: number;
  review_status: string;
  review_reason: string;
  human_decision: string | null;
  final_action: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_reason: string | null;
  reviewer_decision: string | null;
}

interface HumanReviewDetailsPageProps {
  reviewId: string;
  onBack: () => void;
}

export const HumanReviewDetailsPage: React.FC<HumanReviewDetailsPageProps> = ({ reviewId, onBack }) => {
  const [review, setReview] = useState<HumanReviewRecord | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchReviewDetails = async () => {
      try {
        const resReview = await fetch(`http://localhost:8000/api/reviews/${reviewId}`);
        if (!resReview.ok) {
          throw new Error(`Failed to load human review details for ID: ${reviewId}`);
        }
        const dataReview = await resReview.json();
        
        const resEvent = await fetch(`http://localhost:8000/api/recovery/runs/${dataReview.event_id}`);
        if (!resEvent.ok) {
          throw new Error(`Failed to load event pipeline details for ID: ${dataReview.event_id}`);
        }
        const dataEvent = await resEvent.json();
        
        if (active) {
          setReview(dataReview);
          setEventData(dataEvent);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };

    fetchReviewDetails();
    return () => { active = false; };
  }, [reviewId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Tracing review queue parameters...</span>
      </div>
    );
  }

  if (error || !review || !eventData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Review Details</h3>
          <p className="text-red-700 text-sm mt-1 leading-relaxed">{error || "Review record not found."}</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 font-bold text-xs rounded-xl hover:bg-red-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300"
          aria-label="Back to queue"
        >
          <ArrowLeft className="w-5 h-5 text-secondaryText" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-primaryText tracking-tight font-sans">
            Review Workspace — {review.review_id}
          </h1>
          <p className="text-secondaryText text-xs mt-0.5 font-medium">
            Assigned Event: {review.event_id} | Status: <span className="uppercase font-bold">{review.review_status}</span>
          </p>
        </div>
      </div>

      {/* Structured Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Transaction Context */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brandActive" />
              Event Context Details
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Event ID</span>
                <span className="text-primaryText font-bold mt-1 block">{review.event_id}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Event Type</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{eventData.event_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Transaction Amount</span>
                <span className="text-primaryText font-bold mt-1 block">
                  ₹{eventData.amount_in_inr.toLocaleString('en-IN')} (SIMULATED)
                  {eventData.is_cross_border && (
                    <span className="text-[10px] text-secondaryText/80 font-bold block mt-0.5">
                      ({eventData.amount} {eventData.currency})
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Segment / Geography</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">
                  {eventData.customer_segment} / {eventData.is_cross_border ? 'Cross-Border' : 'Domestic'}
                </span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Previous Recovery Attempts</span>
                <span className="text-primaryText font-semibold mt-1 block">{eventData.previous_recovery_attempts}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Customer Success Rate</span>
                <span className="text-primaryText font-semibold mt-1 block">{eventData.customer_previous_success_rate || 80}%</span>
              </div>
            </div>
          </div>

          {/* Section 2: Pipeline Inputs */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brandActive" />
              Pipeline Review Inputs
            </h3>
            <div className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4">
                  <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">AI Diagnosis Core</span>
                  <span className="text-primaryText font-bold block mt-1 capitalize">{eventData.root_cause.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-secondaryText mt-1 block">Recoverability: {eventData.recoverability} | Conf: {Math.round(eventData.confidence*100)}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4">
                  <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Planned Recovery Decision</span>
                  <span className="text-primaryText font-bold block mt-1 capitalize">{eventData.decision.toUpperCase()}</span>
                  <span className="text-[11px] text-secondaryText mt-1 block">Intervention: {eventData.selected_intervention.replace(/_/g, ' ')}</span>
                </div>
              </div>
              
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block mb-1">Diagnosis Reasoning</span>
                <div className="text-slate-650 italic text-[12px] bg-slate-50/30 border border-slate-100 p-3.5 rounded-2xl">
                  "{eventData.reasoning}"
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Decisions & Outcomes */}
        <div className="space-y-6">
          
          {/* Section 3: AI Recovery Agent Findings */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5">AI Agent Assessment</h3>
            <div className="space-y-4 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Agent Run Recommendation</span>
                <span className="text-lg font-black text-brandActive mt-1 block capitalize">
                  {review.proposed_action.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Risk Assessment</span>
                  <span className={`font-extrabold block mt-0.5 capitalize
                    ${review.risk_level === 'critical' ? 'text-red-600' : ''}
                    ${review.risk_level === 'high' ? 'text-rose-500' : ''}
                    ${review.risk_level === 'medium' ? 'text-amber-500' : ''}
                    ${review.risk_level === 'low' ? 'text-slate-500' : ''}
                  `}>
                    {review.risk_level}
                  </span>
                </div>
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Agent Confidence</span>
                  <span className="text-primaryText font-bold block mt-0.5">{Math.round(review.agent_confidence * 100)}%</span>
                </div>
              </div>
              
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs font-semibold text-indigo-700">
                <span className="block font-bold text-[10px] uppercase tracking-wider mb-1">Human Intervention Flag Reason</span>
                {review.review_reason}
              </div>
            </div>
          </div>

          {/* Section 4: Human Review Verdict */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5">Human Resolution</h3>
            <div className="space-y-4 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Resolution Status</span>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mt-2.5 inline-block
                  ${review.review_status === 'pending' ? 'bg-amber-50 text-amber-600' : ''}
                  ${review.review_status === 'approved' ? 'bg-emerald-50 text-emerald-600' : ''}
                  ${review.review_status === 'rejected' ? 'bg-red-50 text-red-600' : ''}
                `}>
                  {review.review_status}
                </span>
              </div>
              
              {review.review_status !== 'pending' && (
                <>
                  <div>
                    <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Human Decision</span>
                    <span className="text-primaryText font-bold mt-1 block capitalize">{review.reviewer_decision}</span>
                  </div>
                  <div>
                    <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Final Resolved Action</span>
                    <span className="text-brandActive font-bold mt-1 block capitalize">{review.final_action?.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Reviewed By</span>
                    <span className="text-primaryText font-bold mt-1 block capitalize">{review.reviewed_by}</span>
                  </div>
                  <div>
                    <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Reviewed Timestamp</span>
                    <span className="text-primaryText font-medium mt-1 block">{review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : '-'}</span>
                  </div>
                  <div>
                    <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Merchant Reviewer Notes</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-650 mt-1 font-semibold leading-relaxed">
                      {review.reviewer_reason}
                    </div>
                  </div>
                </>
              )}
              
              {review.review_status === 'pending' && (
                <div className="text-slate-500 font-bold text-xs italic bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                  Awaiting merchant approval decision in the queue workspace.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
