import { useState, useEffect } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { RevenueAtRiskPage } from './pages/RevenueAtRiskPage';
import { RecoveryRunsPage } from './pages/RecoveryRunsPage';
import { RecoveryRunDetailsPage } from './pages/RecoveryRunDetailsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { checkBackendHealth } from './services/api';
import { RecoveryAgentPage } from './pages/RecoveryAgentPage';
import { AgentRunDetailsPage } from './pages/AgentRunDetailsPage';
import { AgentReviewQueuePage } from './pages/AgentReviewQueuePage';
import { HumanReviewDetailsPage } from './pages/HumanReviewDetailsPage';
import { RecoveryOptimizationPage } from './pages/RecoveryOptimizationPage';
import { AdaptiveStrategyPage } from './pages/AdaptiveStrategyPage';
import { StrategyDetailsPage } from './pages/StrategyDetailsPage';
import { StrategySimulationPage } from './pages/StrategySimulationPage';
import { StrategyVersionsPage } from './pages/StrategyVersionsPage';
import { ControlCenterPage } from './pages/ControlCenterPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { GovernancePage } from './pages/GovernancePage';
import { SystemPipelinePage } from './pages/SystemPipelinePage';

function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [viewRunId, setViewRunId] = useState<string>('');

  // Poll backend health status on startup and every 5 seconds
  useEffect(() => {
    let active = true;

    const verifyHealth = async () => {
      const online = await checkBackendHealth();
      if (active) {
        setIsBackendOnline(online);
      }
    };

    // Initial check
    verifyHealth();

    // Setup periodic polling
    const intervalId = setInterval(verifyHealth, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const getTabLabel = (id: string): string => {
    switch (id) {
      case 'overview':
        return 'Overview';
      case 'revenue-at-risk':
        return 'Revenue at Risk';
      case 'recovery-runs':
        return 'Recovery Runs';
      case 'recovery-agent':
        return 'Recovery Agent';
      case 'agent-run-details':
        return 'Agent Run Details';
      case 'agent-review-queue':
        return 'Agent Review Queue';
      case 'human-review':
        return 'Human Review';
      case 'human-review-detail':
        return 'Human Review Details';
      case 'optimization':
        return 'Optimization';
      case 'adaptive-strategy':
        return 'Adaptive Strategy';
      case 'strategy-details':
        return 'Strategy Details';
      case 'strategy-simulation':
        return 'Strategy Simulation';
      case 'strategy-versions':
        return 'Strategy Versions';
      case 'control-center':
        return 'Control Center';
      case 'anomalies':
        return 'Anomalies';
      case 'governance':
        return 'Governance';
      case 'system-pipeline':
        return 'System Pipeline';
      case 'audit-trail':
        return 'Audit Trail';
      case 'analytics':
        return 'Analytics';
      case 'cross-border':
        return 'Cross-Border';
      default:
        return 'Overview';
    }
  };

  return (
    <DashboardLayout 
      activeTab={
        activeTab === 'run-details' 
          ? 'recovery-runs' 
          : (activeTab === 'agent-run-details' || activeTab === 'agent-review-queue' ? 'recovery-agent' : 
            (activeTab === 'human-review-detail' ? 'human-review' : 
            (activeTab === 'strategy-details' || activeTab === 'strategy-simulation' || activeTab === 'strategy-versions' ? 'adaptive-strategy' : activeTab)))
      } 
      setActiveTab={setActiveTab}
      isBackendOnline={isBackendOnline}
    >
      {activeTab === 'overview' && (
        <OverviewPage isBackendOnline={isBackendOnline} />
      )}
      {activeTab === 'revenue-at-risk' && (
        <RevenueAtRiskPage onViewRun={(eventId) => { setViewRunId(eventId); setActiveTab('run-details'); }} />
      )}
      {activeTab === 'recovery-runs' && (
        <RecoveryRunsPage onViewRun={(eventId) => { setViewRunId(eventId); setActiveTab('run-details'); }} />
      )}
      {activeTab === 'run-details' && (
        <RecoveryRunDetailsPage eventId={viewRunId} onBack={() => setActiveTab('recovery-runs')} />
      )}
      {activeTab === 'recovery-agent' && (
        <RecoveryAgentPage 
          onViewRun={(eventId) => { setViewRunId(eventId); setActiveTab('agent-run-details'); }} 
          onViewQueue={() => setActiveTab('agent-review-queue')} 
        />
      )}
      {activeTab === 'agent-run-details' && (
        <AgentRunDetailsPage eventId={viewRunId} onBack={() => setActiveTab('recovery-agent')} />
      )}
      {activeTab === 'agent-review-queue' && (
        <AgentReviewQueuePage onViewDetails={(reviewId) => { setViewRunId(reviewId); setActiveTab('human-review-detail'); }} />
      )}
      {activeTab === 'human-review' && (
        <AgentReviewQueuePage onViewDetails={(reviewId) => { setViewRunId(reviewId); setActiveTab('human-review-detail'); }} />
      )}
      {activeTab === 'human-review-detail' && (
        <HumanReviewDetailsPage reviewId={viewRunId} onBack={() => setActiveTab('human-review')} />
      )}
      {activeTab === 'optimization' && (
        <RecoveryOptimizationPage />
      )}
      {activeTab === 'adaptive-strategy' && (
        <AdaptiveStrategyPage 
          onViewStrategy={(id) => { setViewRunId(id); setActiveTab('strategy-details'); }}
          onViewSimulation={() => setActiveTab('strategy-simulation')}
          onViewVersions={() => setActiveTab('strategy-versions')}
        />
      )}
      {activeTab === 'strategy-details' && (
        <StrategyDetailsPage strategyId={viewRunId} onBack={() => setActiveTab('adaptive-strategy')} />
      )}
      {activeTab === 'strategy-simulation' && (
        <StrategySimulationPage onBack={() => setActiveTab('adaptive-strategy')} />
      )}
      {activeTab === 'strategy-versions' && (
        <StrategyVersionsPage onBack={() => setActiveTab('adaptive-strategy')} />
      )}
      {activeTab === 'control-center' && (
        <ControlCenterPage onNavigateTab={(tab) => setActiveTab(tab)} />
      )}
      {activeTab === 'anomalies' && (
        <AnomaliesPage />
      )}
      {activeTab === 'governance' && (
        <GovernancePage />
      )}
      {activeTab === 'system-pipeline' && (
        <SystemPipelinePage />
      )}
      {activeTab === 'audit-trail' && (
        <AuditTrailPage />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsPage />
      )}
      {activeTab === 'cross-border' && (
        <ComingSoonPage 
          tabName={getTabLabel(activeTab)} 
          setActiveTab={setActiveTab} 
        />
      )}
    </DashboardLayout>
  );
}

export default App;
