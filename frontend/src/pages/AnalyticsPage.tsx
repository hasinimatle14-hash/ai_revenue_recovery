import React, { useState, useEffect } from 'react';
import { Globe, TrendingUp, Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';
interface AnalyticsSummary {
  generated_at: string;
  total_events: number;
  total_revenue_at_risk: number;
  eligible_events: number;
  successful_recoveries: number;
  failed_recoveries: number;
  blocked_events: number;
  stopped_events: number;
  simulated_revenue_recovered: number;
  recovery_rate: number;
  overall_event_recovery_rate: number;
  recovery_value_percentage: number;
  by_event_type: Record<string, {
    total_events: number;
    revenue_at_risk: number;
    successful_recoveries: number;
    failed_recoveries: number;
    simulated_revenue_recovered: number;
    recovery_rate: number;
  }>;
  by_root_cause: Record<string, {
    root_cause_count: number;
    revenue_at_risk: number;
    successful_recoveries: number;
    simulated_revenue_recovered: number;
  }>;
  by_intervention: Record<string, {
    intervention_count: number;
    success_count: number;
    failure_count: number;
    success_rate: number;
    simulated_recovered_value: number;
  }>;
  by_customer_segment: Record<string, {
    event_count: number;
    revenue_at_risk: number;
    successful_recoveries: number;
    recovery_rate: number;
  }>;
  by_geography: Record<string, {
    event_count: number;
    revenue_at_risk: number;
    recovered_value: number;
    recovery_rate: number;
  }>;
}

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analytics/summary');
        if (!response.ok) {
          throw new Error('Failed to fetch calculated analytics summary data.');
        }
        const data = await response.json();
        if (active) {
          setSummary(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Unknown network error');
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Compiling analytics breakdowns...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Ingest Analytics</h3>
          <p className="text-red-700 text-sm mt-1 leading-relaxed">{error || "Could not read analytics database."}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 font-bold text-xs rounded-xl hover:bg-red-200 transition-colors"
          >
            Retry Ingestion
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
          Analytics
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Simulated revenue recovery outcomes, intervention efficacy rates, and corridor breakdowns.
        </p>
      </div>

      {/* Top metrics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Revenue at Risk</span>
          <h3 className="text-2xl font-extrabold text-primaryText mt-2">
            ₹{summary.total_revenue_at_risk.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Total gagal transaction value</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Simulated Recovered</span>
          <h3 className="text-2xl font-extrabold text-emerald-500 mt-2">
            ₹{summary.simulated_revenue_recovered.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">SIMULATED AMOUNT</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Recovery Rate</span>
          <h3 className="text-2xl font-extrabold text-primaryText mt-2">
            {(summary.recovery_rate * 100).toFixed(2)}%
          </h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Successful / Eligible retries</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Recovery Value Pct</span>
          <h3 className="text-2xl font-extrabold text-primaryText mt-2">
            {(summary.recovery_value_percentage * 100).toFixed(2)}%
          </h3>
          <p className="text-[11px] text-secondaryText/80 font-medium mt-1">Recovered value / Total at risk</p>
        </div>
      </div>

      {/* Secondary Metrics Card */}
      <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
        <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5">
          Recovery Operations Breakdowns
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-[13px] text-center">
          <div>
            <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Total Events</span>
            <span className="text-xl font-extrabold text-primaryText mt-1 block">{summary.total_events}</span>
          </div>
          <div>
            <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Eligible</span>
            <span className="text-xl font-extrabold text-primaryText mt-1 block">{summary.eligible_events}</span>
          </div>
          <div>
            <span className="text-rose-500 font-bold text-xs uppercase tracking-wider block">Stopped (Rules)</span>
            <span className="text-xl font-extrabold text-rose-500 mt-1 block">{summary.stopped_events}</span>
          </div>
          <div>
            <span className="text-rose-500 font-bold text-xs uppercase tracking-wider block">Failed Retries</span>
            <span className="text-xl font-extrabold text-rose-500 mt-1 block">{summary.failed_recoveries}</span>
          </div>
          <div>
            <span className="text-indigo-500 font-bold text-xs uppercase tracking-wider block">Blocked (Review)</span>
            <span className="text-xl font-extrabold text-indigo-500 mt-1 block">{summary.blocked_events}</span>
          </div>
        </div>
      </div>

      {/* Chart indicators grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Breakdown 1: Event Type */}
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-brandActive" />
            Performance by Event Type
          </h3>
          <div className="space-y-5">
            {Object.entries(summary.by_event_type).map(([type, data]) => (
              <div key={type} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="capitalize text-slate-700">{type.replace('_', ' ')} ({data.total_events})</span>
                  <span className="text-brandActive">
                    ₹{data.simulated_revenue_recovered.toLocaleString('en-IN')} / ₹{data.revenue_at_risk.toLocaleString('en-IN')}
                  </span>
                </div>
                {/* Visual Bar Indicator */}
                <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brandActive rounded-full transition-all duration-1000"
                    style={{ width: `${(data.simulated_revenue_recovered / (data.revenue_at_risk || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-secondaryText/80 font-bold">
                  <span>Recovery Rate: {(data.recovery_rate * 100).toFixed(1)}%</span>
                  <span>Value recovered: {((data.simulated_revenue_recovered / (data.revenue_at_risk || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown 2: Root Causes */}
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-6 flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-brandActive" />
            Breakdown by Diagnosed Root Cause
          </h3>
          <div className="space-y-5">
            {Object.entries(summary.by_root_cause)
              .sort((a, b) => b[1].root_cause_count - a[1].root_cause_count)
              .slice(0, 5) // Show top 5
              .map(([cause, data]) => {
                const percentage = (data.root_cause_count / summary.total_events) * 100;
                return (
                  <div key={cause} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="capitalize text-slate-700">{cause.replace('_', ' ')}</span>
                      <span className="text-primaryText">{data.root_cause_count} events ({percentage.toFixed(0)}%)</span>
                    </div>
                    {/* Visual Bar Indicator */}
                    <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-secondaryText/80 font-bold">
                      <span>Value at Risk: ₹{data.revenue_at_risk.toLocaleString('en-IN')}</span>
                      <span className="text-emerald-500">Recovered: ₹{data.simulated_revenue_recovered.toLocaleString('en-IN')} (SIM)</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Breakdown 3: Geography */}
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-6 flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-brandActive" />
            Domestic vs Cross-Border Performance
          </h3>
          <div className="space-y-6 mt-2">
            {Object.entries(summary.by_geography).map(([corridor, data]) => {
              const share = (data.event_count / summary.total_events) * 100;
              return (
                <div key={corridor} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="capitalize text-primaryText">{corridor} corridor</span>
                    <span className="text-brandActive">{(data.recovery_rate * 100).toFixed(2)}% recovery rate</span>
                  </div>
                  
                  {/* Visual Split Bar */}
                  <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 rounded-l-full transition-all duration-1000"
                      style={{ width: `${(data.recovered_value / (data.revenue_at_risk || 1)) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-rose-400 transition-all duration-1000"
                      style={{ width: `${((data.revenue_at_risk - data.recovered_value) / (data.revenue_at_risk || 1)) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-secondaryText/80 font-bold pt-1">
                    <div>
                      <span className="block text-slate-500">Volume Share</span>
                      <span className="text-primaryText font-extrabold text-xs block mt-0.5">{share.toFixed(1)}% ({data.event_count})</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Total at Risk</span>
                      <span className="text-primaryText font-extrabold text-xs block mt-0.5">₹{data.revenue_at_risk.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="block text-emerald-500">Recovered (SIM)</span>
                      <span className="text-emerald-500 font-extrabold text-xs block mt-0.5">₹{data.recovered_value.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown 4: Intervention Efficacy */}
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-brandActive" />
            Efficacy by Intervention Channel
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {Object.entries(summary.by_intervention)
              .sort((a, b) => b[1].success_rate - a[1].success_rate)
              .map(([intervention, data]) => (
                <div key={intervention} className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 capitalize block">{intervention.replace('_', ' ')}</span>
                    <span className="text-[10px] text-secondaryText font-medium block">
                      Count: {data.intervention_count} | Success: {data.success_count}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider block w-fit ml-auto
                      ${data.success_rate >= 0.7 ? 'bg-emerald-50 text-emerald-600' : ''}
                      ${data.success_rate >= 0.4 && data.success_rate < 0.7 ? 'bg-amber-50 text-amber-600' : ''}
                      ${data.success_rate < 0.4 ? 'bg-rose-50 text-rose-600' : ''}
                    `}>
                      {(data.success_rate * 100).toFixed(1)}% success
                    </span>
                    <span className="text-[9px] text-emerald-500 font-bold block mt-1">
                      ₹{data.simulated_recovered_value.toLocaleString('en-IN')} recovered (SIM)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
};
