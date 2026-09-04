import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Layers } from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';

interface ControlCenterSummary {
  system_health: {
    status: string;
    pipeline_completion_percentage: number;
    warnings: string[];
    last_health_check: string;
  };
  revenue_at_risk: number;
  simulated_recovered_revenue: number;
  simulated_recovery_rate: number;
  attempts_breakdown: {
    successful: number;
    failed: number;
    skipped: number;
    blocked: number;
  };
  human_review_summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  anomalies_summary: {
    detected_count: number;
    open: number;
    acknowledged: number;
    resolved: number;
  };
  governance_summary: {
    status: string;
    compliance_percentage: number;
    violations_count: number;
  };
  pipeline_stages: Array<{
    stage: string;
    status: string;
    processed_count: number;
    expected_count: number;
    completion_percentage: number;
    output_generated: string;
  }>;
}

interface ControlCenterPageProps {
  onNavigateTab: (tab: string) => void;
}

export const ControlCenterPage: React.FC<ControlCenterPageProps> = ({ onNavigateTab }) => {
  const [summary, setSummary] = useState<ControlCenterSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/control-center/summary`);
        if (!response.ok) {
          throw new Error('Failed to load Recovery Control Center summary payload.');
        }
        const data = await response.json();
        if (active) {
          setSummary(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };
    fetchSummary();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Orchestrating control center telemetry...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Control Center</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-brandActive" />
            Recovery Control Center
          </h1>
          <p className="text-secondaryText text-sm mt-1.5 font-medium">
            Unified operational command layer monitoring system health, pipeline progression, and governance compliance.
          </p>
        </div>

        {/* Health Status Badge */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-secondaryText">System Health:</span>
          <StatusIndicator status="online" text="Healthy" />
        </div>
      </div>

      {/* Overview Financial KPI Cards - explicit SIMULATED labeling */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">SIMULATED Revenue at Risk</span>
          <h3 className="text-2xl font-black text-primaryText mt-2">
            ₹{summary.revenue_at_risk.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-secondaryText font-bold mt-1 uppercase tracking-wide">SIMULATED VALUE</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">SIMULATED Revenue Recovered</span>
          <h3 className="text-2xl font-black text-emerald-500 mt-2">
            ₹{summary.simulated_recovered_revenue.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wide">SIMULATED VALUE</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">SIMULATED Recovery Rate</span>
          <h3 className="text-2xl font-black text-primaryText mt-2">
            {Math.round(summary.simulated_recovery_rate * 100)}%
          </h3>
          <p className="text-[10px] text-brandActive font-bold mt-1 uppercase tracking-wide">Pipeline Yield Rate</p>
        </div>
      </div>

      {/* 9 Pipeline Stage Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-primaryText flex items-center gap-2">
            <Layers className="w-5 h-5 text-brandActive" />
            9-Stage System Pipeline Progression
          </h3>
          <button 
            onClick={() => onNavigateTab('system-pipeline')}
            className="text-xs font-bold text-brandActive hover:underline flex items-center gap-1"
          >
            View Full Pipeline <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {summary.pipeline_stages.map((stage, idx) => (
            <div key={stage.stage} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-brandActive bg-brandActive/[0.04] px-2 py-0.5 rounded">
                  Stage {idx + 1}
                </span>
                <StatusIndicator status="online" text="Completed" />
              </div>
              <h4 className="font-extrabold text-sm text-primaryText">{stage.stage}</h4>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Processed: <span className="text-slate-800 font-bold">{stage.processed_count} / {stage.expected_count}</span>
              </p>
              
              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Completion</span>
                <span className="text-emerald-600">{stage.completion_percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className="bg-emerald-500 h-full" style={{ width: `${stage.completion_percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
