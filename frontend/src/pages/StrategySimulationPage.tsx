import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, HelpCircle, Activity, Sparkles } from 'lucide-react';

interface SimulationDetails {
  simulation_version: string;
  baseline_recovery_rate: number;
  projected_recovery_rate: number;
  baseline_recovered_value: number;
  projected_recovered_value: number;
  projected_incremental_value: number;
  intervention_comparison: Array<{
    intervention: string;
    baseline_success_rate: number;
    projected_success_rate: number;
    assumed_improvement: string;
  }>;
  cohort_comparison: Array<{
    cohort: string;
    baseline_recovered: number;
    projected_recovered: number;
    gain: number;
    notes: string;
  }>;
  assumptions: string[];
}

interface StrategySimulationPageProps {
  onBack: () => void;
}

export const StrategySimulationPage: React.FC<StrategySimulationPageProps> = ({ onBack }) => {
  const [sim, setSim] = useState<SimulationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchSim = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/strategy/simulation');
        if (!response.ok) {
          throw new Error('Failed to load what-if strategy simulation projection models.');
        }
        const data = await response.json();
        if (active) {
          setSim(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };
    fetchSim();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Running what-if simulations...</span>
      </div>
    );
  }

  if (error || !sim) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Strategy Simulation</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
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
          aria-label="Back to strategy center"
        >
          <ArrowLeft className="w-5 h-5 text-secondaryText" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brandActive" />
            What-If Strategy Simulation Workspace
          </h1>
          <p className="text-secondaryText text-xs mt-0.5 font-medium">
            Hypothetical projected recovery yields generated using historical cohort strategy algorithms.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Baseline Recovery</span>
          <h3 className="text-xl font-black text-slate-800 mt-2">
            ₹{sim.baseline_recovered_value.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">
            ACTUAL SIMULATED RESULT ({Math.round(sim.baseline_recovery_rate * 100)}% rate)
          </p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Projected Recovery</span>
          <h3 className="text-xl font-black text-emerald-500 mt-2">
            ₹{sim.projected_recovered_value.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            PROJECTED SIMULATED RESULT ({Math.round(sim.projected_recovery_rate * 100)}% rate)
          </p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30 bg-gradient-to-br from-brandActive/[0.02] to-transparent">
          <span className="text-xs text-brandActive font-bold uppercase tracking-wider block">Simulated Incremental Gain</span>
          <h3 className="text-xl font-black text-brandActive mt-2">
            +₹{sim.projected_incremental_value.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-brandActive font-bold mt-1">
            PROJECTED SIMULATED INCREMENTAL VALUE
          </p>
        </div>
      </div>

      {/* Main Split Layout: Performance and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Intervention Comparison Table */}
        <div className="bg-white rounded-4xl shadow-card border border-slate-100/30 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-[15px] text-primaryText flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brandActive" />
              Intervention Strategy Yield Projections
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-secondaryText uppercase tracking-wider">
                  <th className="py-4 px-6">Intervention</th>
                  <th className="py-4 px-6 text-center">Baseline Rate</th>
                  <th className="py-4 px-6 text-center text-emerald-600">Projected Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] font-medium text-slate-700">
                {sim.intervention_comparison.map((item) => (
                  <tr key={item.intervention} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-bold capitalize text-primaryText">{item.intervention.replace(/_/g, ' ')}</td>
                    <td className="py-4.5 px-6 text-center">{Math.round(item.baseline_success_rate * 100)}%</td>
                    <td className="py-4.5 px-6 text-center font-bold text-emerald-500">
                      {Math.round(item.projected_success_rate * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cohort opportunities comparison list */}
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30 space-y-5">
          <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brandActive" />
            Incremental Opportunities by Cohort
          </h3>
          
          <div className="space-y-4">
            {sim.cohort_comparison.map((c) => (
              <div key={c.cohort} className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-[13px] text-primaryText capitalize">{c.cohort.replace(/_/g, ' ')}</h4>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    +₹{c.gain.toLocaleString('en-IN')} gain
                  </span>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                  {c.notes}
                </p>
                <div className="text-[10px] text-slate-500 font-bold flex gap-4 mt-2">
                  <span>Baseline: ₹{c.baseline_recovered.toLocaleString('en-IN')} (ACTUAL SIMULATED)</span>
                  <span>Projected: ₹{c.projected_recovered.toLocaleString('en-IN')} (PROJECTED SIMULATED)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Assumptions section */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 mt-6 flex items-start gap-4">
        <HelpCircle className="w-5.5 h-5.5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-indigo-700 text-sm uppercase tracking-wider">Simulation Assumptions</h4>
          <ul className="list-disc list-inside text-slate-650 text-xs mt-2 space-y-1.5 font-semibold">
            {sim.assumptions.map((asm, idx) => (
              <li key={idx}>{asm}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
