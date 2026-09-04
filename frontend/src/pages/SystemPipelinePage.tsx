import React, { useState, useEffect } from 'react';
import { Layers, ArrowDown, FileText } from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';

interface PipelineStage {
  stage: string;
  status: string;
  processed_count: number;
  expected_count: number;
  completion_percentage: number;
  output_generated: string;
}

export const SystemPipelinePage: React.FC = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchPipeline = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/system/pipeline`);
        if (!response.ok) {
          throw new Error('Failed to load system pipeline progression stages.');
        }
        const data = await response.json();
        if (active) {
          setStages(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };
    fetchPipeline();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Tracing 9-stage pipeline progression flow...</span>
      </div>
    );
  }

  if (error || stages.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load System Pipeline</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
          <Layers className="w-8 h-8 text-brandActive" />
          System Pipeline Architecture & Progression
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          End-to-end 9-stage progression flow mapping data transformations from ingestion through continuous learning and audit logs.
        </p>
      </div>

      {/* Vertical Pipeline Progression Flow */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {stages.map((stg, idx) => (
          <React.Fragment key={stg.stage}>
            <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brandActive/[0.06] text-brandActive font-black flex items-center justify-center text-sm shrink-0">
                  0{idx + 1}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-primaryText">{stg.stage}</h3>
                  <p className="text-xs text-secondaryText/80 font-medium flex items-center gap-1 mt-0.5">
                    <FileText className="w-3.5 h-3.5" /> Output File: <span className="font-mono text-slate-700 font-bold">{stg.output_generated}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 self-end md:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Processed Items</span>
                  <span className="text-xs font-black text-slate-800">{stg.processed_count} / {stg.expected_count} ({stg.completion_percentage}%)</span>
                </div>

                <StatusIndicator status="online" text="Completed" />
              </div>
            </div>

            {/* Connecting Arrow (except last item) */}
            {idx < stages.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
