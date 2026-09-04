import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Info, ShieldAlert, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  merchant_country: string;
  is_cross_border: boolean;
  previous_recovery_attempts: number;
  root_cause: string;
  confidence: number;
  recoverability: string;
  reasoning: string;
  decision: string;
  eligible_for_recovery: boolean;
  selected_intervention: string;
  timing: string;
  priority_score: number;
  eligibility_reason: string;
  current_state: string;
  next_state: string;
  attempt_id: string;
  execution_status: string;
  outcome: string;
  simulated_amount_recovered: number;
  failure_reason: string | null;
  execution_reason: string;
  executed_at: string;
}

interface RecoveryRunDetailsPageProps {
  eventId: string;
  onBack: () => void;
}

export const RecoveryRunDetailsPage: React.FC<RecoveryRunDetailsPageProps> = ({ eventId, onBack }) => {
  const [run, setRun] = useState<RevenueRunRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchRun = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/recovery/runs/${eventId}`);
        if (!response.ok) {
          throw new Error(`Failed to load recovery run details for ID: ${eventId}`);
        }
        const data = await response.json();
        if (active) {
          setRun(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Unknown network error');
          setLoading(false);
        }
      }
    };

    fetchRun();
    return () => { active = false; };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Inquiring recovery lifecycle records...</span>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Ingest Lifecycle</h3>
          <p className="text-red-700 text-sm mt-1 leading-relaxed">{error || "Event run details could not be found."}</p>
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

  // Create timeline objects chronologically
  const timelineSteps = [
    {
      title: 'Event Detected',
      time: new Date(run.timestamp).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' }),
      description: `Ingestion pipeline registered a B2B ${run.event_type.replace('_', ' ')} for ₹${run.amount_in_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}.`,
      status: 'completed'
    },
    {
      title: 'AI Diagnosis Compiled',
      time: new Date(new Date(run.timestamp).getTime() + 2000).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' }),
      description: `AI diagnosed failure as '${run.root_cause.replace('_', ' ')}' with ${Math.round(run.confidence * 100)}% confidence. Forecasted recoverability: ${run.recoverability}.`,
      status: 'completed'
    },
    {
      title: 'Decision Engine Executed',
      time: new Date(new Date(run.timestamp).getTime() + 5000).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' }),
      description: `Recovery rules loaded. Action selected: '${run.selected_intervention.replace('_', ' ')}' with priority ${run.priority_score}. Current state: ${run.current_state}.`,
      status: 'completed'
    },
    {
      title: 'Simulated Execution Finished',
      time: run.executed_at ? new Date(run.executed_at).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' }) : '-',
      description: run.outcome === 'success' 
        ? `Simulated retry succeeded. Fully recovered sum: ₹${run.amount_in_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (SIMULATED).` 
        : `Simulated retry completed with state: ${run.outcome.toUpperCase()}. ${run.failure_reason || ''} ${run.execution_reason || ''}`,
      status: run.outcome
    }
  ];

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300"
          aria-label="Back to runs"
        >
          <ArrowLeft className="w-5 h-5 text-secondaryText" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-primaryText tracking-tight font-sans">
            Run Details — {run.event_id}
          </h1>
          <p className="text-secondaryText text-xs mt-0.5 font-medium">
            Ingestion timestamp: {new Date(run.timestamp).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Main Details and Timeline Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Lifecycle Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Event Information */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <ShieldAlert className="w-5 h-5 text-brandActive" />
              <h3 className="font-extrabold text-[15px] text-primaryText">Event Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Event Type</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{run.event_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Corridor</span>
                <span className="text-primaryText font-semibold mt-1 block">
                  {run.is_cross_border ? `Cross-Border (${run.country} ➜ ${run.merchant_country})` : 'Domestic (IN)'}
                </span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Transaction Amount</span>
                <span className="text-primaryText font-bold mt-1 block">
                  ₹{run.amount_in_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  {run.is_cross_border && (
                    <span className="text-[10px] text-secondaryText font-medium block mt-0.5">
                      ({run.amount.toLocaleString()} {run.currency})
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Payment Method</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{run.payment_method.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Customer Segment</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{run.customer_segment}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Previous Recovery Attempts</span>
                <span className="text-primaryText font-semibold mt-1 block">{run.previous_recovery_attempts}</span>
              </div>
            </div>
          </div>

          {/* Section 2: AI Diagnosis */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <Cpu className="w-5 h-5 text-brandActive" />
              <h3 className="font-extrabold text-[15px] text-primaryText">AI Diagnosis</h3>
            </div>
            
            <div className="space-y-4 text-[13px]">
              <div className="flex items-center gap-8">
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Diagnosed Cause</span>
                  <span className="text-primaryText font-bold mt-1 block capitalize">{run.root_cause.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Confidence</span>
                  <span className="text-primaryText font-bold mt-1 block">{Math.round(run.confidence * 100)}%</span>
                </div>
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Recoverability</span>
                  <span className="text-primaryText font-bold mt-1 block capitalize">{run.recoverability}</span>
                </div>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block mb-1">Reasoning Analysis</span>
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-slate-600 leading-relaxed font-medium">
                  {run.reasoning}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Recovery Rules & Decision */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <Info className="w-5 h-5 text-brandActive" />
              <h3 className="font-extrabold text-[15px] text-primaryText">Recovery Decision Engine</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Decision Value</span>
                <span className="text-primaryText font-bold mt-1 block uppercase">{run.decision}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Intervention Channel</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{run.selected_intervention.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Scheduled Timing</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{run.timing.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Priority Score</span>
                <span className="text-primaryText font-bold mt-1 block">{run.priority_score.toFixed(2)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Eligibility Reason</span>
                <span className="text-primaryText font-medium mt-1 block">{run.eligibility_reason}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Execution Outcomes */}
        <div className="space-y-6">
          {/* Simulated Outcome Card */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <CheckCircle2 className="w-5 h-5 text-brandActive" />
              <h3 className="font-extrabold text-[15px] text-primaryText">Execution Results</h3>
            </div>
            
            <div className="space-y-4 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Simulated Recovered Amount</span>
                {run.outcome === 'success' ? (
                  <div className="mt-1">
                    <span className="text-2xl font-black text-emerald-500">
                      ₹{run.amount_in_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">SIMULATED</span>
                  </div>
                ) : (
                  <span className="text-slate-400 font-bold block mt-1">₹0.00</span>
                )}
              </div>

              <div className="flex justify-between border-t border-slate-50 pt-3">
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Status</span>
                  <span className="text-primaryText font-bold mt-0.5 block capitalize">{run.execution_status}</span>
                </div>
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Outcome</span>
                  <span className="text-primaryText font-bold mt-0.5 block capitalize">{run.outcome}</span>
                </div>
              </div>

              {run.failure_reason && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs font-semibold text-rose-700">
                  <span className="font-bold uppercase tracking-wider block text-[10px] mb-1">Failure Reason</span>
                  {run.failure_reason}
                </div>
              )}
            </div>
          </div>

          {/* Visual Timeline Steps Card */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-6">Run Timeline</h3>
            
            <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-8">
              {timelineSteps.map((step, idx) => {
                const isSuccess = step.status === 'success';
                const isFailed = step.status === 'failed';
                const isSkipped = step.status === 'skipped';
                const isBlocked = step.status === 'blocked';
                
                return (
                  <div key={idx} className="relative group">
                    {/* Circle Node Dot */}
                    <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm
                      ${step.status === 'completed' || isSuccess ? 'bg-emerald-500' : ''}
                      ${isFailed ? 'bg-rose-500' : ''}
                      ${isSkipped ? 'bg-slate-400' : ''}
                      ${isBlocked ? 'bg-indigo-500' : ''}
                    `} />
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[13px] text-primaryText">{step.title}</h4>
                        <span className="text-[10px] text-secondaryText font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.time}
                        </span>
                      </div>
                      <p className="text-xs text-secondaryText/90 font-medium mt-1 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
