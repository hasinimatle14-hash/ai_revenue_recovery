import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AgentRunRecord {
  agent_run_id: string;
  event_id: string;
  diagnosis_id: string;
  decision_id: string;
  attempt_id: string;
  recommended_action: string;
  risk_level: string;
  confidence: number;
  action_priority: number;
  requires_human_review: boolean;
  human_review_reason: string | null;
  reasoning: string;
  next_state: string;
  policy_checks: {
    override_required: boolean;
    triggered_rules: string[];
    reason: string | null;
  };
  execution_mode: string;
}

interface TimelineStep {
  step: string;
  status: string;
  description: string;
}

interface AgentRunDetailsPageProps {
  eventId: string;
  onBack: () => void;
}

export const AgentRunDetailsPage: React.FC<AgentRunDetailsPageProps> = ({ eventId, onBack }) => {
  const [run, setRun] = useState<AgentRunRecord | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchRunDetails = async () => {
      try {
        const resRun = await fetch(`http://localhost:8000/api/agent/runs/${eventId}`);
        const resEvent = await fetch(`http://localhost:8000/api/recovery/runs/${eventId}`);
        const resTimeline = await fetch(`http://localhost:8000/api/agent/runs/${eventId}/timeline`);
        
        if (!resRun.ok || !resEvent.ok || !resTimeline.ok) {
          throw new Error(`Failed to load AI Agent run parameters for ID: ${eventId}`);
        }
        
        const dataRun = await resRun.json();
        const dataEvent = await resEvent.json();
        const dataTimeline = await resTimeline.json();
        
        if (active) {
          setRun(dataRun);
          setEventData(dataEvent);
          setTimeline(dataTimeline);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Unknown network error');
          setLoading(false);
        }
      }
    };

    fetchRunDetails();
    return () => { active = false; };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Tracing agent loop execution path...</span>
      </div>
    );
  }

  if (error || !run || !eventData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Run Details</h3>
          <p className="text-red-700 text-sm mt-1 leading-relaxed">{error || "Agent parameters not found."}</p>
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
      {/* Back Button Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300"
          aria-label="Back to agent"
        >
          <ArrowLeft className="w-5 h-5 text-secondaryText" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-primaryText tracking-tight font-sans">
            Agent Evaluation Details — {run.agent_run_id} ({eventId})
          </h1>
          <p className="text-secondaryText text-xs mt-0.5 font-medium">
            Execution Mode: {run.execution_mode.toUpperCase()} (SIMULATED)
          </p>
        </div>
      </div>

      {/* Structured Info Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Context Card Stack */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section A: Event Context */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brandActive" />
              Event Transaction Context
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Event ID</span>
                <span className="text-primaryText font-bold mt-1 block">{run.event_id}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Event Type</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{eventData.event_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Transaction Amount</span>
                <span className="text-primaryText font-bold mt-1 block">
                  ₹{eventData.amount_in_inr.toLocaleString('en-IN')}
                  {eventData.is_cross_border && (
                    <span className="text-[10px] text-secondaryText/80 font-bold block mt-0.5">
                      ({eventData.amount} {eventData.currency})
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Segment / Corridor</span>
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

          {/* Section B: Pipeline Review (Diagnosis & Decision) */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brandActive" />
              Pipeline Inputs (Part 3 & Part 4)
            </h3>
            
            <div className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4">
                  <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Diagnosis Ingestion</span>
                  <span className="text-primaryText font-bold block mt-1 capitalize">{eventData.root_cause.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-secondaryText mt-1 block">Recoverability: {eventData.recoverability} | Conf: {Math.round(eventData.confidence*100)}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4">
                  <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Decision Ingestion</span>
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

          {/* Section C: Safety Guardrails & Policy Checks */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brandActive" />
              Safety Guardrails (agent_policy.py)
            </h3>
            <div className="space-y-4 text-[13px]">
              <div className="flex items-center gap-8">
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Override Required</span>
                  <span className={`font-bold mt-1 block ${run.policy_checks.override_required ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {run.policy_checks.override_required ? 'YES (OVERRIDDEN)' : 'NO (CLEAR)'}
                  </span>
                </div>
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Triggered Rules</span>
                  <span className="text-primaryText font-semibold mt-1 block">
                    {run.policy_checks.triggered_rules.length > 0 ? run.policy_checks.triggered_rules.join(', ') : 'None'}
                  </span>
                </div>
              </div>
              
              {run.policy_checks.override_required && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs font-semibold text-rose-700">
                  <span className="block font-bold text-[10px] uppercase tracking-wider mb-1">Safety Override Trigger Reason</span>
                  {run.policy_checks.reason}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Agent Verdict & Timeline */}
        <div className="space-y-6">
          
          {/* Agent Verdict Block */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5">Agent Decision</h3>
            <div className="space-y-4 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Recommended Action</span>
                <span className="text-lg font-black text-brandActive mt-1 block capitalize">
                  {run.recommended_action.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Risk Assessment</span>
                  <span className={`font-extrabold block mt-0.5 capitalize
                    ${run.risk_level === 'critical' ? 'text-red-600' : ''}
                    ${run.risk_level === 'high' ? 'text-rose-500' : ''}
                    ${run.risk_level === 'medium' ? 'text-amber-500' : ''}
                    ${run.risk_level === 'low' ? 'text-slate-500' : ''}
                  `}>
                    {run.risk_level}
                  </span>
                </div>
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Agent Confidence</span>
                  <span className="text-primaryText font-bold block mt-0.5">{Math.round(run.confidence * 100)}%</span>
                </div>
              </div>
              
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Routing state</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1.5 inline-block
                  ${run.requires_human_review ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}
                `}>
                  {run.next_state.replace(/_/g, ' ')}
                </span>
              </div>
              
              {run.requires_human_review && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs font-semibold text-indigo-700">
                  <span className="block font-bold text-[10px] uppercase tracking-wider mb-1">Human Intervention Reason</span>
                  {run.human_review_reason}
                </div>
              )}

              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block mb-1">Agent Reasoning Analysis</span>
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 text-slate-650 leading-relaxed font-medium">
                  {run.reasoning}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Node Block */}
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-6">Orchestration Steps</h3>
            
            <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Indicator Bubble */}
                  <span className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full border border-white bg-brandActive flex items-center justify-center shadow-xs" />
                  
                  <div>
                    <h4 className="font-bold text-[13px] text-primaryText leading-none">{step.step}</h4>
                    <p className="text-xs text-secondaryText mt-1.5 leading-relaxed font-medium">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
