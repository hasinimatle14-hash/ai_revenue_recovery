import React, { useState, useEffect } from 'react';
import { TrendingUp, Cpu, AlertTriangle, Zap } from 'lucide-react';

interface GlobalMetrics {
  total_events: number;
  total_simulated_revenue_at_risk: number;
  total_simulated_revenue_recovered: number;
  overall_recovery_rate: number;
  recovery_value_percentage: number;
}

interface InterventionMetric {
  intervention: string;
  attempts: number;
  successes: number;
  failures: number;
  simulated_revenue_recovered: number;
  success_rate: number;
  average_recovered_amount: number;
}

interface Recommendation {
  recommendation_id: string;
  cohort: string;
  recommended_intervention: string;
  confidence: number;
  supporting_event_count: number;
  reason: string;
}

export const RecoveryOptimizationPage: React.FC = () => {
  const [global, setGlobal] = useState<GlobalMetrics | null>(null);
  const [interventions, setInterventions] = useState<InterventionMetric[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchOptimizationData = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const resGlobal = await fetch(`${API_BASE_URL}/api/optimization/summary`);
        const resInterv = await fetch(`${API_BASE_URL}/api/optimization/interventions`);
        const resRecs = await fetch(`${API_BASE_URL}/api/optimization/recommendations`);
        
        if (!resGlobal.ok || !resInterv.ok || !resRecs.ok) {
          throw new Error('Failed to load Recovery Optimization insights.');
        }
        
        const dataGlobal = await resGlobal.json();
        const dataInterv = await resInterv.json();
        const dataRecs = await resRecs.json();
        
        if (active) {
          setGlobal(dataGlobal);
          setInterventions(dataInterv);
          setRecommendations(dataRecs);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Unknown network error');
          setLoading(false);
        }
      }
    };

    fetchOptimizationData();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Running cohort optimization calculations...</span>
      </div>
    );
  }

  if (error || !global) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-red-800 text-lg">Failed to Ingest Insights</h3>
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
          <TrendingUp className="w-8 h-8 text-brandActive" />
          Recovery Optimization Engine
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Simulated cohort success rate breakdowns, channel yields, and actionable policy optimizations.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Simulated Revenue at Risk</span>
          <h3 className="text-xl font-black text-primaryText mt-2">
            ₹{global.total_simulated_revenue_at_risk.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-secondaryText/80 font-bold mt-1 uppercase tracking-wide">SIMULATED VALUE</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Simulated Revenue Recovered</span>
          <h3 className="text-xl font-black text-emerald-500 mt-2">
            ₹{global.total_simulated_revenue_recovered.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-emerald-600/80 font-bold mt-1 uppercase tracking-wide">SIMULATED VALUE</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Simulated Recovery Rate</span>
          <h3 className="text-xl font-black text-primaryText mt-2">
            {Math.round(global.overall_recovery_rate * 100)}%
          </h3>
          <p className="text-[10px] text-secondaryText/80 font-bold mt-1 uppercase tracking-wide">Transaction Success Count</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Recovery Value Rate</span>
          <h3 className="text-xl font-black text-primaryText mt-2">
            {Math.round(global.recovery_value_percentage * 100)}%
          </h3>
          <p className="text-[10px] text-secondaryText/80 font-bold mt-1 uppercase tracking-wide">Financial recovery yield</p>
        </div>
      </div>

      {/* Main Split Layout: Performance and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Intervention Performance Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-4xl shadow-card border border-slate-100/30 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-[15px] text-primaryText flex items-center gap-2">
                <Cpu className="w-5 h-5 text-brandActive" />
                Intervention Performance Breakdown
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-secondaryText uppercase tracking-wider">
                    <th className="py-4 px-6">Intervention</th>
                    <th className="py-4 px-6 text-center">Attempts</th>
                    <th className="py-4 px-6 text-center">Success Rate</th>
                    <th className="py-4 px-6 text-right">Revenue Recovered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] font-medium text-slate-700">
                  {interventions.map((item) => (
                    <tr key={item.intervention} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold capitalize text-primaryText">{item.intervention.replace(/_/g, ' ')}</td>
                      <td className="py-4 px-6 text-center">{item.attempts}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold">{Math.round(item.success_rate * 100)}%</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div className="bg-brandActive h-full" style={{ width: `${item.success_rate * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900">
                        ₹{item.simulated_revenue_recovered.toLocaleString('en-IN')}
                        <span className="text-[9px] text-secondaryText block font-bold mt-0.5">SIMULATED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Actionable Recommendations list */}
        <div className="space-y-6">
          <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
            <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-brandActive" />
              Actionable Recommendations
            </h3>
            
            <div className="space-y-6">
              {recommendations.map((rec) => (
                <div key={rec.recommendation_id} className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-brandActive font-bold uppercase tracking-wider bg-brandActive/[0.04] px-2 py-0.5 rounded">
                      {rec.recommendation_id}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      {Math.round(rec.confidence * 100)}% Conf
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[13px] text-primaryText capitalize">{rec.cohort.replace(/_/g, ' ')}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                      Proposed: <span className="capitalize text-slate-700 font-extrabold">{rec.recommended_intervention.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                    {rec.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
