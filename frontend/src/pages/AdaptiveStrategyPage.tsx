import React, { useState, useEffect } from 'react';
import { Sliders, BrainCircuit, ArrowRight, TrendingUp, History } from 'lucide-react';

interface StrategySummary {
  learning_version: string;
  events_analyzed: number;
  strategies_generated: number;
  cohorts_analyzed: number;
  best_intervention: string;
  best_performing_cohort: string;
  projected_simulated_recovery: number;
  confidence: number;
}

interface AdaptiveStrategy {
  strategy_id: string;
  cohort: string;
  recommended_intervention: string;
  recommended_timing: string;
  expected_success_rate: number;
  expected_recovery_value_rate: number;
  confidence: number;
  sample_size: number;
  reasoning: string;
  strategy_version: string;
}

interface AdaptiveStrategyPageProps {
  onViewStrategy: (id: string) => void;
  onViewSimulation: () => void;
  onViewVersions: () => void;
}

export const AdaptiveStrategyPage: React.FC<AdaptiveStrategyPageProps> = ({
  onViewStrategy,
  onViewSimulation,
  onViewVersions
}) => {
  const [summary, setSummary] = useState<StrategySummary | null>(null);
  const [strategies, setStrategies] = useState<AdaptiveStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const resSum = await fetch(`${API_BASE_URL}/api/strategy/learning`);
        const resStr = await fetch(`${API_BASE_URL}/api/strategies`);
        if (!resSum.ok || !resStr.ok) {
          throw new Error('Failed to ingest strategy engine summaries.');
        }
        const dataSum = await resSum.json();
        const dataStr = await resStr.json();
        if (active) {
          setSummary(dataSum);
          setStrategies(dataStr);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Consolidating cohort feedback loops...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Strategy Engine</h3>
        <p className="text-red-700 text-sm mt-1">{error || 'Data is missing.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
            <Sliders className="w-8 h-8 text-brandActive" />
            Adaptive Strategy Center
          </h1>
          <p className="text-secondaryText text-sm mt-1.5 font-medium">
            Version-controlled continuous learning layer compiling simulated recovery rules from cohort statistics.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onViewSimulation}
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-brandActive hover:bg-brandActive/90 transition-colors px-4 py-2.5 rounded-2xl shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            What-If Simulator
          </button>
          <button 
            onClick={onViewVersions}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors px-4 py-2.5 rounded-2xl shadow-sm"
          >
            <History className="w-4 h-4" />
            Version History
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Strategies Generated</span>
          <h3 className="text-2xl font-black text-primaryText mt-2">{summary.strategies_generated}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1.5">Across {summary.cohorts_analyzed} distinct cohorts</p>
        </div>
        
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Average Confidence</span>
          <h3 className="text-2xl font-black text-primaryText mt-2">{Math.round(summary.confidence * 100)}%</h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-1.5">High calibration accuracy</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Active Version</span>
          <h3 className="text-2xl font-black text-brandActive mt-2">{summary.learning_version}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1.5">Last compiled 12:00 UTC</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Projected Recovery</span>
          <h3 className="text-2xl font-black text-emerald-500 mt-2">
            ₹{summary.projected_simulated_recovery.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1.5">PROJECTED SIMULATED VALUE</p>
        </div>
      </div>

      {/* Cohort Strategy Recommendations Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-brandActive" />
          Compiled Cohort Strategy Rules
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {strategies.map((s) => (
            <div 
              key={s.strategy_id} 
              onClick={() => onViewStrategy(s.strategy_id)}
              className="bg-white hover:bg-slate-50/30 rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brandActive/[0.04] text-brandActive px-2.5 py-0.5 rounded-lg">
                    {s.strategy_id}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {Math.round(s.confidence * 100)}% Confidence
                  </span>
                </div>
                
                <div>
                  <h4 className="font-extrabold text-[14px] text-primaryText capitalize">
                    {s.cohort.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">
                    Timing: <span className="text-slate-700 font-extrabold">{s.recommended_timing.replace(/_/g, ' ')}</span> | 
                    Intervention: <span className="capitalize text-brandActive font-extrabold">{s.recommended_intervention.replace(/_/g, ' ')}</span>
                  </p>
                </div>
                
                <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                  {s.reasoning}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-secondaryText hover:text-brandActive transition-colors">
                <span>View strategy statistics details</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
