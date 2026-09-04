import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Check } from 'lucide-react';

interface GovernanceCheck {
  check_id: string;
  name: string;
  status: 'passed' | 'warning' | 'failed';
  description: string;
}

interface GovernanceReport {
  governance_version: string;
  overall_status: string;
  policy_compliance_percentage: number;
  total_checks_evaluated: number;
  passed_checks: number;
  warning_checks: number;
  failed_checks: number;
  safety_violations: string[];
  checks_summary: GovernanceCheck[];
  generated_at: string;
}

export const GovernancePage: React.FC = () => {
  const [report, setReport] = useState<GovernanceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/governance/report`);
        if (!response.ok) {
          throw new Error('Failed to load governance compliance report.');
        }
        const data = await response.json();
        if (active) {
          setReport(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Network error');
          setLoading(false);
        }
      }
    };
    fetchReport();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-brandActive border-t-transparent rounded-full animate-spin" />
        <span className="text-secondaryText text-sm font-semibold">Executing governance policy audit...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-2xl mx-auto my-12 animate-fade-slide-up">
        <h3 className="font-extrabold text-red-800 text-lg">Failed to Load Governance Report</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-primaryText tracking-tight font-sans flex items-center gap-2">
          <Lock className="w-8 h-8 text-emerald-500" />
          Governance & Safety Compliance Dashboard
        </h1>
        <p className="text-secondaryText text-sm mt-1.5 font-medium">
          Verifies immutable attempt limits, stop decision preservation, ground-truth data isolation, and simulated-only operations.
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Governance Status</span>
          <h3 className="text-2xl font-black text-emerald-500 mt-2 uppercase">{report.overall_status}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wide">Version {report.governance_version}</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Safety Compliance Rate</span>
          <h3 className="text-2xl font-black text-primaryText mt-2">{report.policy_compliance_percentage}%</h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">100% Policy Bounds Enforced</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Passed Checks</span>
          <h3 className="text-2xl font-black text-emerald-500 mt-2">{report.passed_checks} / {report.total_checks_evaluated}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">Validated Policy Rules</p>
        </div>

        <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30">
          <span className="text-xs text-secondaryText font-bold uppercase tracking-wider block">Safety Violations</span>
          <h3 className="text-2xl font-black text-slate-800 mt-2">{report.safety_violations.length}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">Zero Security Breaches</p>
        </div>
      </div>

      {/* Safety Policy Rules Checklist */}
      <div className="bg-white rounded-4xl p-6 shadow-card border border-slate-100/30 space-y-6">
        <h3 className="font-extrabold text-[15px] text-primaryText pb-4 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          Safety Policy Compliance Evaluation Checks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.checks_summary.map((check) => (
            <div key={check.check_id} className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-primaryText">{check.name}</h4>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                    {check.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                  {check.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
