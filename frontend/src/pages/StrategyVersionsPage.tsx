import React, { useState, useEffect } from 'react';
import { ArrowLeft, History, ChevronDown, ChevronUp } from 'lucide-react';

interface VersionChange {
  cohort: string;
  previous_timing: string;
  new_timing: string;
  performance_difference: string;
  reason_for_change: string;
}

interface VersionRecord {
  version: string;
  released_at: string;
  description: string;
  changes_count: number;
  changes: VersionChange[];
}

interface StrategyVersionsPageProps {
  onBack: () => void;
}

export const StrategyVersionsPage: React.FC<StrategyVersionsPageProps> = ({ onBack }) => {
  const [history, setHistory] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/strategies/versions');
        if (!response.ok) {
          throw new Error('Failed to load version history changelog logs.');
        }
        const data = await response.json();
        if (active) {
          setHistory(data);
          setLoading(false);
          // Expand latest version by default
          if (data.length > 0) {
            setExpandedVersion(data[data.length - 1].version);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };
    fetchHistory();
    return () => { active = false; };
  }, []);

  const toggleExpand = (version: string) => {
    setExpandedVersion(prev => prev === version ? null : version);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Loading version history...</span>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Strategy Versions</h3>
        <p className="text-red-700 text-sm mt-1">{error || 'Changelog records are missing.'}</p>
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
            <History className="w-6 h-6 text-brandActive" />
            Strategy Version Control Changelogs
          </h1>
          <p className="text-secondaryText text-xs mt-0.5 font-medium">
            Chronological audit of optimization timing modifications and performance difference yields.
          </p>
        </div>
      </div>

      {/* Version Records list */}
      <div className="space-y-6">
        {history.map((ver) => {
          const isExpanded = expandedVersion === ver.version;
          return (
            <div 
              key={ver.version} 
              className="bg-white rounded-4xl border border-slate-100/50 shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div 
                onClick={() => toggleExpand(ver.version)}
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-base text-primaryText">{ver.version}</h3>
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">
                      {ver.changes_count} {ver.changes_count === 1 ? 'change' : 'changes'}
                    </span>
                  </div>
                  <p className="text-xs text-secondaryText/80 font-medium">
                    Released on: {new Date(ver.released_at).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>{isExpanded ? 'Collapse' : 'Expand changelog'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Collapsible content */}
              {isExpanded && (
                <div className="p-6 bg-slate-50/20 border-t border-slate-100 space-y-4">
                  <div className="text-xs text-slate-600 leading-relaxed font-semibold">
                    <span className="font-bold text-slate-800">Release Notes:</span> {ver.description}
                  </div>
                  
                  {ver.changes.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">timing updates detail:</h4>
                      
                      <div className="space-y-4">
                        {ver.changes.map((ch, idx) => (
                          <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-[13px] text-primaryText capitalize">
                                {ch.cohort.replace(/_/g, ' ')}
                              </h5>
                              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                {ch.performance_difference}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-500">
                              <div>
                                <span className="font-bold text-slate-700 block">Previous Timing:</span>
                                <span className="capitalize mt-0.5 block">{ch.previous_timing.replace(/_/g, ' ')}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-700 block">Optimized Timing:</span>
                                <span className="capitalize mt-0.5 block text-brandActive font-extrabold">{ch.new_timing.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-slate-650 leading-relaxed font-semibold bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                              <span className="font-bold text-slate-700">Reason:</span> {ch.reason_for_change}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
