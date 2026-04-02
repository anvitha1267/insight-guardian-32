import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsBar from '@/components/dashboard/StatsBar';
import AnomalyChart from '@/components/dashboard/AnomalyChart';
import TimeSeriesPanel from '@/components/dashboard/TimeSeriesPanel';
import PercentChangeTable from '@/components/dashboard/PercentChangeTable';
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel';
import ComparisonPanel from '@/components/dashboard/ComparisonPanel';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeseries', label: 'Time Series' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'insights', label: 'AI Insights' },
] as const;

type TabId = typeof tabs[number]['id'];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen grid-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 p-1 glass-panel rounded-lg w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-mono transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 pb-12">
            <StatsBar />
            <AnomalyChart />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PercentChangeTable />
              <AIInsightsPanel />
            </div>
          </div>
        )}

        {/* Time Series Tab */}
        {activeTab === 'timeseries' && (
          <div className="space-y-6 pb-12">
            <TimeSeriesPanel />
            <AnomalyChart category="Marketing" />
            <AnomalyChart category="Travel" />
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6 pb-12">
            <ComparisonPanel />
            <PercentChangeTable />
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6 pb-12">
            <AIInsightsPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
