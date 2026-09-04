import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  RotateCw, 
  History, 
  BarChart2, 
  Globe, 
  Menu, 
  X, 
  Search, 
  Bell,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Sliders,
  AlertTriangle,
  Lock,
  Layers
} from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';

interface NavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendOnline: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab,
  isBackendOnline
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'overview', name: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'revenue-at-risk', name: 'Revenue at Risk', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'recovery-runs', name: 'Recovery Runs', icon: <RotateCw className="w-5 h-5" /> },
    { id: 'recovery-agent', name: 'Recovery Agent', icon: <Cpu className="w-5 h-5" /> },
    { id: 'human-review', name: 'Human Review', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'optimization', name: 'Optimization', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'adaptive-strategy', name: 'Adaptive Strategy', icon: <Sliders className="w-5 h-5" /> },
    { id: 'control-center', name: 'Control Center', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'anomalies', name: 'Anomalies', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'governance', name: 'Governance', icon: <Lock className="w-5 h-5" /> },
    { id: 'system-pipeline', name: 'System Pipeline', icon: <Layers className="w-5 h-5" /> },
    { id: 'audit-trail', name: 'Audit Trail', icon: <History className="w-5 h-5" /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'cross-border', name: 'Cross-Border', icon: <Globe className="w-5 h-5" /> },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row relative">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden w-full bg-white h-16 px-4 flex items-center justify-between border-b border-slate-100 shadow-sm z-30">
        <div className="flex items-center gap-2">
          {/* Custom logo element matching the reference image's 'Peymen' visual structure */}
          <div className="flex items-center gap-1.5 font-sans font-extrabold text-xl tracking-tight">
            <span className="text-brandActive">AI</span>
            <span className="text-primaryText font-semibold text-base -ml-0.5">Revenue Recovery</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator 
            status={isBackendOnline ? 'online' : 'offline'} 
            text={isBackendOnline ? 'Online' : 'Offline'} 
          />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100/50 shadow-sidebar z-40 transform transition-transform duration-300 ease-in-out flex flex-col justify-between
        md:translate-x-0 md:static md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header / Logo */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            {/* Logo matching the Peymen design language (clean text with stylized branding) */}
            <div className="flex items-center gap-1.5 font-sans font-extrabold text-xl tracking-tight">
              <span className="text-brandActive">AI</span>
              <span className="text-primaryText font-semibold text-base -ml-0.5">Revenue Recovery</span>
            </div>
            {/* Close button inside mobile menu drawer */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-10 space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 text-left font-sans font-semibold text-[15px] rounded-xl transition-all duration-300 relative group
                    ${isActive 
                      ? 'text-brandActive bg-transparent' 
                      : 'text-secondaryText hover:text-primaryText hover:bg-slate-50/60'
                    }
                  `}
                >
                  {/* Left edge active indicator bar matching the reference image's visual structure */}
                  <span className={`
                    absolute left-0 top-1/4 bottom-1/4 w-1 bg-brandActive rounded-r-md transition-all duration-300
                    ${isActive ? 'opacity-100 h-1/2 scale-100' : 'opacity-0 h-0 scale-50 group-hover:opacity-40 group-hover:h-1/3 group-hover:scale-100'}
                  `} />

                  <span className={`
                    transition-transform duration-300 group-hover:scale-110
                    ${isActive ? 'text-brandActive' : 'text-secondaryText group-hover:text-primaryText'}
                  `}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Banner (Premium card recreation at the bottom left) */}
        <div className="p-4 mb-2">
          <div className="gradient-accent-purple rounded-3xl p-5 text-white shadow-lg relative overflow-hidden group">
            {/* Abstract decorative floating circles matching background graphics in the reference */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-sm transition-transform duration-500 group-hover:scale-125" />
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-sm" />

            <div className="relative z-10">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-sm leading-snug">Track 03</h4>
              <p className="text-[11px] text-white/80 mt-1 mb-4 leading-relaxed font-medium">
                Razorpay Buildathon 2026 AI Revenue Recovery Agent
              </p>
              <a 
                href="#blueprint" 
                onClick={(e) => { e.preventDefault(); handleNavClick('overview'); }}
                className="inline-block w-full text-center py-2 px-3 bg-white text-brandActive rounded-xl font-bold text-xs shadow-sm transition-all duration-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
              >
                Active Agent
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top/Header Area */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 bg-canvas border-b border-slate-100/10 shrink-0">
          <div>
            <span className="text-[13px] font-semibold text-secondaryText">Hi Merchant,</span>
            <h2 className="text-xl font-bold text-primaryText tracking-tight">Welcome to AI Revenue Recovery</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Pill */}
            <div className="relative w-64">
              <input 
                type="text" 
                placeholder="Search..."
                disabled
                className="w-full bg-white border border-transparent shadow-sm rounded-full py-2 pl-10 pr-4 text-sm text-primaryText placeholder-secondaryText/70 focus:outline-none focus:border-brandActive/40 focus:ring-1 focus:ring-brandActive/40 cursor-not-allowed"
              />
              <Search className="w-4 h-4 text-secondaryText absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Backend Connectivity Status Indicator */}
            <StatusIndicator 
              status={isBackendOnline ? 'online' : 'offline'} 
              text={isBackendOnline ? 'Backend: Online' : 'Backend: Offline'} 
            />

            {/* Notification bell and profile matching the reference UI */}
            <div className="flex items-center gap-4">
              <button 
                disabled
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm relative hover:bg-slate-50 hover:shadow-md active:scale-95 transition-all duration-300 cursor-not-allowed group"
              >
                <Bell className="w-4.5 h-4.5 text-secondaryText group-hover:text-primaryText transition-colors" />
                {/* Glowing notification badge dot */}
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-alertOrange border-2 border-white ring-1 ring-alertOrange/30 animate-pulse" />
              </button>

              {/* Profile Avatar Circle */}
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-white flex items-center justify-center bg-brandActive text-white font-extrabold text-xs">
                RA
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-canvas">
          {children}
        </main>
      </div>

      {/* Overlay for mobile drawer */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}
    </div>
  );
};
