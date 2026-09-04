import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Percent, 
  Play, 
  ArrowRight,
  Cpu,
  BrainCircuit,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';

interface OverviewPageProps {
  isBackendOnline: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ isBackendOnline }) => {
  const [diagnosisStatus, setDiagnosisStatus] = React.useState<{
    status: 'ready' | 'not_ready' | 'loading';
    eventsAnalyzed: number;
    diagnosesGenerated: number;
  }>({ status: 'loading', eventsAnalyzed: 0, diagnosesGenerated: 0 });

  const [recoveryStatus, setRecoveryStatus] = React.useState<{
    status: 'ready' | 'not_ready' | 'loading';
    eventsProcessed: number;
    decisionsGenerated: number;
  }>({ status: 'loading', eventsProcessed: 0, decisionsGenerated: 0 });

  const [executionStatus, setExecutionStatus] = React.useState<{
    status: 'ready' | 'not_ready' | 'loading';
    eventsProcessed: number;
    attemptsCreated: number;
    simulatedRevenue: number;
  }>({ status: 'loading', eventsProcessed: 0, attemptsCreated: 0, simulatedRevenue: 0.0 });

  const [analytics, setAnalytics] = React.useState<{
    total_events: number;
    total_revenue_at_risk: number;
    simulated_revenue_recovered: number;
    recovery_rate: number;
  } | null>(null);

  const [agentStatus, setAgentStatus] = React.useState<{
    status: 'ready' | 'not_ready' | 'loading';
    eventsProcessed: number;
    humanReviewQueue: number;
  }>({ status: 'loading', eventsProcessed: 0, humanReviewQueue: 0 });

  const [reviewsStatus, setReviewsStatus] = React.useState<{
    status: 'ready' | 'not_ready' | 'loading';
    total: number;
    pending: number;
  }>({ status: 'loading', total: 0, pending: 0 });

  const [strategyStatus, setStrategyStatus] = React.useState<{
    status: 'ready' | 'not_ready' | 'loading';
    strategiesGenerated: number;
    learningVersion: string;
  }>({ status: 'loading', strategiesGenerated: 0, learningVersion: 'strategy-v1.0' });

  React.useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analytics/summary');
        if (response.ok && active) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (e) {
        console.warn("Failed to fetch analytics summary:", e);
      }
    };
    if (isBackendOnline) {
      fetchAnalytics();
    }
  }, [isBackendOnline]);

  React.useEffect(() => {
    let active = true;
    const fetchAgentStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/agent/status');
        if (response.ok && active) {
          const data = await response.json();
          setAgentStatus({
            status: data.status,
            eventsProcessed: data.events_processed,
            humanReviewQueue: data.human_review_queue
          });
        }
      } catch (e) {
        console.warn("Failed to fetch agent status:", e);
        if (active) {
          setAgentStatus({ status: 'not_ready', eventsProcessed: 0, humanReviewQueue: 0 });
        }
      }
    };
    const fetchReviewsStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/reviews/status');
        if (response.ok && active) {
          const data = await response.json();
          setReviewsStatus({
            status: data.status,
            total: data.total_reviews,
            pending: data.pending
          });
        }
      } catch (e) {
        console.warn("Failed to fetch reviews status:", e);
        if (active) {
          setReviewsStatus({ status: 'not_ready', total: 0, pending: 0 });
        }
      }
    };
    const fetchStrategyStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/strategy/status');
        if (response.ok && active) {
          const data = await response.json();
          setStrategyStatus({
            status: data.status,
            strategiesGenerated: data.strategies_generated,
            learningVersion: data.learning_version
          });
        }
      } catch (e) {
        console.warn("Failed to fetch strategy status:", e);
        if (active) {
          setStrategyStatus({ status: 'not_ready', strategiesGenerated: 0, learningVersion: 'strategy-v1.0' });
        }
      }
    };
    if (isBackendOnline) {
      fetchAgentStatus();
      fetchReviewsStatus();
      fetchStrategyStatus();
    }
    const interval = setInterval(() => {
      if (isBackendOnline) {
        fetchAgentStatus();
        fetchReviewsStatus();
        fetchStrategyStatus();
      }
    }, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isBackendOnline]);

  React.useEffect(() => {
    let active = true;
    
    const fetchRecoveryStatus = async () => {
      try {
        const response = await fetch('/api/recovery/status');
        if (response.ok && active) {
          const data = await response.json();
          setRecoveryStatus({
            status: data.status,
            eventsProcessed: data.events_processed,
            decisionsGenerated: data.decisions_generated
          });
        }
      } catch (err) {
        try {
          const response = await fetch('http://localhost:8000/api/recovery/status');
          if (response.ok && active) {
            const data = await response.json();
            setRecoveryStatus({
              status: data.status,
              eventsProcessed: data.events_processed,
              decisionsGenerated: data.decisions_generated
            });
            return;
          }
        } catch (e) {
          console.warn("Failed to fetch recovery status:", e);
        }
        if (active) {
          setRecoveryStatus({ status: 'not_ready', eventsProcessed: 0, decisionsGenerated: 0 });
        }
      }
    };
    
    if (isBackendOnline) {
      fetchRecoveryStatus();
    } else {
      setRecoveryStatus({ status: 'not_ready', eventsProcessed: 0, decisionsGenerated: 0 });
    }
    
    const interval = setInterval(() => {
      if (isBackendOnline) {
        fetchRecoveryStatus();
      }
    }, 5000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isBackendOnline]);

  React.useEffect(() => {
    let active = true;
    
    const fetchExecutionStatus = async () => {
      try {
        const response = await fetch('/api/recovery/execution/status');
        if (response.ok && active) {
          const data = await response.json();
          setExecutionStatus({
            status: data.status,
            eventsProcessed: data.events_processed,
            attemptsCreated: data.attempts_created,
            simulatedRevenue: data.simulated_revenue_recovered
          });
        }
      } catch (err) {
        try {
          const response = await fetch('http://localhost:8000/api/recovery/execution/status');
          if (response.ok && active) {
            const data = await response.json();
            setExecutionStatus({
              status: data.status,
              eventsProcessed: data.events_processed,
              attemptsCreated: data.attempts_created,
              simulatedRevenue: data.simulated_revenue_recovered
            });
            return;
          }
        } catch (e) {
          console.warn("Failed to fetch execution status:", e);
        }
        if (active) {
          setExecutionStatus({ status: 'not_ready', eventsProcessed: 0, attemptsCreated: 0, simulatedRevenue: 0.0 });
        }
      }
    };
    
    if (isBackendOnline) {
      fetchExecutionStatus();
    } else {
      setExecutionStatus({ status: 'not_ready', eventsProcessed: 0, attemptsCreated: 0, simulatedRevenue: 0.0 });
    }
    
    const interval = setInterval(() => {
      if (isBackendOnline) {
        fetchExecutionStatus();
      }
    }, 5000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isBackendOnline]);

  React.useEffect(() => {
    let active = true;
    
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/diagnosis/status');
        if (response.ok && active) {
          const data = await response.json();
          setDiagnosisStatus({
            status: data.status,
            eventsAnalyzed: data.events_analyzed,
            diagnosesGenerated: data.diagnoses_generated
          });
        }
      } catch (err) {
        try {
          const response = await fetch('http://localhost:8000/api/diagnosis/status');
          if (response.ok && active) {
            const data = await response.json();
            setDiagnosisStatus({
              status: data.status,
              eventsAnalyzed: data.events_analyzed,
              diagnosesGenerated: data.diagnoses_generated
            });
            return;
          }
        } catch (e) {
          console.warn("Failed to fetch diagnosis status:", e);
        }
        if (active) {
          setDiagnosisStatus({ status: 'not_ready', eventsAnalyzed: 0, diagnosesGenerated: 0 });
        }
      }
    };
    
    if (isBackendOnline) {
      fetchStatus();
    } else {
      setDiagnosisStatus({ status: 'not_ready', eventsAnalyzed: 0, diagnosesGenerated: 0 });
    }
    
    const interval = setInterval(() => {
      if (isBackendOnline) {
        fetchStatus();
      }
    }, 5000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isBackendOnline]);

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans">
          AI Revenue Recovery Agent
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Detect, diagnose, recover, and measure revenue at risk.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric: Revenue at Risk */}
        <div className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group border border-slate-100/30">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-secondaryText uppercase tracking-wider">Revenue at Risk</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100/70 transition-colors">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-primaryText">
              {analytics ? `₹${analytics.total_revenue_at_risk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
            </h3>
            <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <span>{analytics ? analytics.total_events : 0} events at risk</span>
            </p>
          </div>
        </div>

        {/* Metric: Recovered */}
        <div className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group border border-slate-100/30">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-secondaryText uppercase tracking-wider">Recovered</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100/70 transition-colors">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-emerald-500">
              {analytics ? `₹${analytics.simulated_revenue_recovered.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
            </h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
              <span>SIMULATED RECOVERY</span>
            </p>
          </div>
        </div>

        {/* Metric: Recovery Rate */}
        <div className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group border border-slate-100/30">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-secondaryText uppercase tracking-wider">Recovery Rate</span>
            <div className="w-8 h-8 rounded-full bg-brandActive/5 flex items-center justify-center text-brandActive group-hover:bg-brandActive/10 transition-colors">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-primaryText">
              {analytics ? `${(analytics.recovery_rate * 100).toFixed(1)}%` : '0%'}
            </h3>
            <p className="text-xs text-secondaryText font-medium mt-1">
              {analytics ? 'Calculated on eligible runs' : 'Awaiting first recovery run'}
            </p>
          </div>
        </div>

        {/* Metric: Active Recovery Runs */}
        <div className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group border border-slate-100/30">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-secondaryText uppercase tracking-wider">Active Runs</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
              <Play className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-primaryText">
              {analytics ? analytics.total_events : '0'}
            </h3>
            <p className="text-xs text-emerald-500 font-semibold mt-1">Recovery simulation active</p>
          </div>
        </div>
      </div>

      {/* Middle Sections: Feature Card & Mock SVG Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Banner Card representing the Peymen "Reach financial goals faster" block */}
        <div className="bg-white rounded-4xl p-8 shadow-card border border-slate-100/30 lg:col-span-7 flex flex-col justify-between hover:shadow-card-hover transition-shadow duration-300 min-h-[300px]">
          <div>
            <h3 className="text-2xl font-extrabold text-primaryText leading-snug tracking-tight">
              Recover lost revenue<br />smarter & faster
            </h3>
            <p className="text-secondaryText text-sm mt-3 max-w-sm leading-relaxed font-medium">
              Monitor credit card declines, checkout dropoffs, failed subscription renewals, and overdue B2B invoices automatically using automated agents.
            </p>
          </div>
          
          {/* Floating dynamic accent card mirroring the visual structure of the reference image */}
          <div className="my-6 relative bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-slate-100/50 p-6 rounded-3xl flex items-center justify-between overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-brandActive/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-brandActive" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">Diagnosis Ingestion Pipeline</h4>
                <p className="text-xs text-secondaryText mt-0.5 font-medium">Auto-listening on failed events</p>
              </div>
            </div>
            <StatusIndicator status="neutral" text="Awaiting data" />
          </div>

          <div>
            <button className="flex items-center gap-2 px-6 py-3 bg-brandActive hover:bg-brandHover active:scale-95 text-white font-bold text-sm rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg">
              <span>View System Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Structural placeholder for chart, matching design parameters */}
        <div className="bg-white rounded-4xl p-8 shadow-card border border-slate-100/30 lg:col-span-5 hover:shadow-card-hover transition-shadow duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-secondaryText uppercase tracking-wider">Recovery History</span>
              <span className="text-xs font-bold text-secondaryText bg-slate-100 px-2.5 py-1 rounded-full uppercase">Analytics</span>
            </div>
            <h3 className="text-3xl font-extrabold text-primaryText mt-2">
              {analytics ? `₹${analytics.simulated_revenue_recovered.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0.0'}
            </h3>
            <p className="text-[10px] text-emerald-500 font-extrabold">TOTAL SIMULATED RECOVERY</p>
          </div>

          {/* Recovery Outcome Distribution visual meter */}
          <div className="my-6 h-36 w-full border border-slate-100 rounded-2xl flex flex-col justify-center bg-slate-50/50 p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-primaryText">
              <span>Simulated Retry Outcomes</span>
              <span className="text-brandActive">{analytics ? `${((analytics.simulated_revenue_recovered / analytics.total_revenue_at_risk) * 100).toFixed(0)}% recovered` : '0%'}</span>
            </div>
            
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: analytics ? `${(analytics.simulated_revenue_recovered / analytics.total_revenue_at_risk) * 100}%` : '0%' }} />
              <div className="bg-rose-400 h-full transition-all duration-1000" style={{ width: analytics ? `${((analytics.total_revenue_at_risk - analytics.simulated_revenue_recovered) / analytics.total_revenue_at_risk) * 100}%` : '100%' }} />
            </div>
            
            <div className="flex justify-between text-[9px] font-extrabold text-secondaryText uppercase tracking-wider">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Success</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-400 rounded-full" /> Fail / Stop</span>
            </div>
          </div>

          <div className="flex justify-between text-secondaryText text-[11px] font-bold border-t border-slate-50 pt-3">
            <span>-</span>
            <span>-</span>
            <span>-</span>
            <span>-</span>
            <span>-</span>
            <span>-</span>
          </div>
        </div>
      </div>

      {/* System Status Section */}
      <div className="bg-white rounded-4xl p-8 shadow-card border border-slate-100/30 hover:shadow-card-hover transition-shadow duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-primaryText tracking-tight">System Status</h3>
            <p className="text-secondaryText text-xs mt-1 font-medium">Connectivity and intelligence engine states.</p>
          </div>
          {/* Main API server connectivity */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-secondaryText">FastAPI Service:</span>
            {isBackendOnline ? (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Offline
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
          {/* Status Element: Recovery Execution */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">Recovery Execution</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  {executionStatus.status === 'ready'
                    ? `${executionStatus.attemptsCreated} attempts simulated`
                    : 'Simulation run status'
                  }
                </p>
                {executionStatus.status === 'ready' && (
                  <p className="text-[10px] text-brandActive font-bold mt-1">
                    ₹{executionStatus.simulatedRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} simulated recovered
                  </p>
                )}
              </div>
            </div>
            <StatusIndicator 
              status={executionStatus.status === 'ready' ? 'online' : 'neutral'} 
              text={executionStatus.status === 'ready' ? 'Ready' : 'Not initialized'} 
            />
          </div>

          {/* Status Element: Recovery Engine */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">Recovery Engine</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  {recoveryStatus.status === 'ready'
                    ? `${recoveryStatus.eventsProcessed} events processed`
                    : 'State machine retry driver'
                  }
                </p>
              </div>
            </div>
            <StatusIndicator 
              status={recoveryStatus.status === 'ready' ? 'online' : 'neutral'} 
              text={recoveryStatus.status === 'ready' ? 'Ready' : 'Not initialized'} 
            />
          </div>

          {/* Status Element: AI Diagnosis */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">AI Diagnosis</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  {diagnosisStatus.status === 'ready'
                    ? `${diagnosisStatus.eventsAnalyzed} events analyzed`
                    : 'Reason patterns identifier'
                  }
                </p>
              </div>
            </div>
            <StatusIndicator 
              status={diagnosisStatus.status === 'ready' ? 'online' : 'neutral'} 
              text={diagnosisStatus.status === 'ready' ? 'Ready' : 'Not initialized'} 
            />
          </div>

          {/* Status Element: AI Recovery Agent */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">AI Recovery Agent</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  {agentStatus.status === 'ready'
                    ? `${agentStatus.eventsProcessed} events evaluated`
                    : 'Decision orchestration agent'
                  }
                </p>
                {agentStatus.status === 'ready' && (
                  <p className="text-[10px] text-brandActive font-bold mt-1">
                    Human Review: {agentStatus.humanReviewQueue}
                  </p>
                )}
              </div>
            </div>
            <StatusIndicator 
              status={agentStatus.status === 'ready' ? 'online' : 'neutral'} 
              text={agentStatus.status === 'ready' ? 'Ready' : 'Not initialized'} 
            />
          </div>

          {/* Status Element: Human Review */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">Human Review</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  {reviewsStatus.status === 'ready'
                    ? `${reviewsStatus.total} total cases`
                    : 'Awaiting manual reviews'
                  }
                </p>
                {reviewsStatus.status === 'ready' && (
                  <p className="text-[10px] text-brandActive font-bold mt-1">
                    Pending Queue: {reviewsStatus.pending}
                  </p>
                )}
              </div>
            </div>
            <StatusIndicator 
              status={reviewsStatus.status === 'ready' ? 'online' : 'neutral'} 
              text={reviewsStatus.status === 'ready' ? 'Ready' : 'Not initialized'} 
            />
          </div>

          {/* Status Element: Optimization */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">Optimization</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  SIMULATED performance insights
                </p>
                <p className="text-[10px] text-emerald-500 font-bold mt-1">
                  Ready
                </p>
              </div>
            </div>
            <StatusIndicator 
              status="online" 
              text="Ready" 
            />
          </div>

          {/* Status Element: Adaptive Strategy */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">Adaptive Strategy</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  {strategyStatus.status === 'ready'
                    ? `${strategyStatus.strategiesGenerated} strategies generated`
                    : 'Awaiting cohort learning'
                  }
                </p>
                <p className="text-[10px] text-brandActive font-bold mt-1">
                  {strategyStatus.learningVersion}
                </p>
              </div>
            </div>
            <StatusIndicator 
              status={strategyStatus.status === 'ready' ? 'online' : 'neutral'} 
              text={strategyStatus.status === 'ready' ? 'Ready' : 'Not initialized'} 
            />
          </div>

          {/* Status Element: Control Center */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-start justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-primaryText">Control Center</h4>
                <p className="text-xs text-secondaryText/80 font-medium mt-0.5">
                  100% pipeline complete
                </p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">
                  Governance: Compliant
                </p>
              </div>
            </div>
            <StatusIndicator 
              status="online" 
              text="Healthy" 
            />
          </div>
        </div>

        {/* Bottom Alert informing user about next build stages */}
        <div className="bg-brandActive/[0.03] border border-brandActive/10 rounded-2xl p-4 mt-6 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-brandActive shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed font-medium">
            <span className="font-bold text-brandActive">Agent Status:</span> Recovery engines, database syncs, and AI diagnostic routines are active. Showing live metrics from the simulation dataset.
          </div>
        </div>
      </div>
    </div>
  );
};
