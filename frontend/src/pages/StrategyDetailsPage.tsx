import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sliders, Info } from 'lucide-react';

interface AdaptiveStrategy {
  strategy_id: string;
  cohort: string;
  applicable_root_causes: string[];
  recommended_intervention: string;
  recommended_timing: string;
  expected_success_rate: number;
  expected_recovery_value_rate: number;
  confidence: number;
  sample_size: number;
  reasoning: string;
  strategy_version: string;
  created_at: string;
  status: string;
}

interface StrategyDetailsPageProps {
  strategyId: string;
  onBack: () => void;
}

export const StrategyDetailsPage: React.FC<StrategyDetailsPageProps> = ({ strategyId, onBack }) => {
  const [strategy, setStrategy] = useState<AdaptiveStrategy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/strategies/${strategyId}`);
        if (!response.ok) {
          throw new Error(`Failed to load details for strategy ID: ${strategyId}`);
        }
        const data = await response.json();
        if (active) {
          setStrategy(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };
    fetchDetails();
    return () => { active = false; };
  }, [strategyId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Loading strategy details...</span>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Strategy Details</h3>
        <p className="text-red-700 text-sm mt-1">{error || 'Data is missing.'}</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-100 text-red-800 font-bold text-xs rounded-xl hover:bg-red-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Header bar */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300"
          aria-label="Back to strategies"
        >
          <ArrowLeft className="w-5 h-5 text-secondaryText" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-primaryText tracking-tight font-sans">
            Strategy Rule Details — {strategy.strategy_id}
          </h1>
          <p className="text-secondaryText text-xs mt-0.5 font-medium">
            Active version: {strategy.strategy_version} | Status: <span className="uppercase font-bold text-emerald-500">{strategy.status}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core parameters column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brandActive" />
              Strategic Configuration Rules
            </h3>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-6 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Cohort Name</span>
                <span className="text-primaryText font-bold mt-1 block capitalize">{strategy.cohort.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Timing Execution</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">{strategy.recommended_timing.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Recommended Intervention</span>
                <span className="text-brandActive font-bold mt-1 block capitalize">{strategy.recommended_intervention.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Applicable Root Causes</span>
                <span className="text-primaryText font-semibold mt-1 block capitalize">
                  {strategy.applicable_root_causes.join(', ').replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <Info className="w-5 h-5 text-brandActive" />
              Reasoning & Rationale
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold bg-slate-50 border border-slate-100/80 p-4 rounded-2xl">
              {strategy.reasoning}
            </p>
          </div>
        </div>

        {/* Strategy metrics column */}
        <div className="space-y-6">
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5">Performance Yields</h3>
            
            <div className="space-y-4 text-[13px]">
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Expected Success Rate</span>
                <span className="text-lg font-black text-emerald-500 mt-1 block">
                  {Math.round(strategy.expected_success_rate * 100)}%
                </span>
              </div>
              <div>
                <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Expected Value Yield</span>
                <span className="text-lg font-black text-primaryText mt-1 block">
                  {Math.round(strategy.expected_recovery_value_rate * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Confidence</span>
                  <span className="font-bold block mt-0.5 text-slate-700">{Math.round(strategy.confidence * 100)}%</span>
                </div>
                <div>
                  <span className="text-secondaryText font-bold text-xs uppercase tracking-wider block">Sample Size</span>
                  <span className="font-bold block mt-0.5 text-slate-700">{strategy.sample_size} cases</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
