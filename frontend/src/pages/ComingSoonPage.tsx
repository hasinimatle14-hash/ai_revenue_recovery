import React from 'react';
import { Sparkles, ArrowLeft, Hourglass } from 'lucide-react';

interface ComingSoonPageProps {
  tabName: string;
  setActiveTab: (tab: string) => void;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ tabName, setActiveTab }) => {
  const getTabDetails = () => {
    switch (tabName) {
      case 'Revenue at Risk':
        return 'Detailed real-time detection logs showing failing checkouts, invoice delays, and bank decline signals.';
      case 'Recovery Runs':
        return 'Control center to monitor active execution runs, automated emails, retry logs, and customer communication state machines.';
      case 'Audit Trail':
        return 'Chronological trace log of merchant settings, diagnostic decisions, client touchpoints, and billing corrections.';
      case 'Analytics':
        return 'Interactive cohort graphs showing financial recovery performance, ROI, channel efficiency, and decline codes distributions.';
      case 'Cross-Border':
        return 'International compliance controls, local routing optimizations, currency-smart dynamic payment corridors, and global retry schedulers.';
      default:
        return 'Autonomous routines to retrieve lost business revenue.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] p-6 text-center animate-fade-slide-up">
      {/* Centered Decorative Accent Graphic */}
      <div className="w-16 h-16 rounded-3xl bg-brandActive/5 flex items-center justify-center text-brandActive mb-6 shadow-sm border border-slate-100/50">
        <Hourglass className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
      </div>

      <h3 className="text-xs font-bold text-brandActive uppercase tracking-widest flex items-center gap-1.5 justify-center">
        <Sparkles className="w-3.5 h-3.5" />
        Prototype Foundation — Part 1
      </h3>
      
      <h1 className="text-3xl font-extrabold text-primaryText mt-3 tracking-tight font-sans">
        {tabName} Module
      </h1>
      
      <p className="text-secondaryText text-sm mt-3 max-w-md leading-relaxed font-medium">
        {getTabDetails()}
      </p>

      {/* Primary Highlight Message */}
      <div className="mt-8 px-6 py-4 bg-white border border-slate-100 shadow-card rounded-3xl text-sm font-bold text-brandActive inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brandActive animate-pulse" />
        Coming in the next build stage
      </div>

      <button 
        onClick={() => setActiveTab('overview')}
        className="mt-8 flex items-center gap-2 text-secondaryText hover:text-primaryText text-xs font-bold transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Return to Overview Dashboard
      </button>
    </div>
  );
};
