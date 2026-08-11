import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsBar from '@/components/dashboard/StatsBar';
import AnomalyChart from '@/components/dashboard/AnomalyChart';
import TimeSeriesPanel from '@/components/dashboard/TimeSeriesPanel';
import PercentChangeTable from '@/components/dashboard/PercentChangeTable';
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel';
import ComparisonPanel from '@/components/dashboard/ComparisonPanel';
import ImportUSASpending from '@/components/dashboard/ImportUSASpending';
import StateSelector from '@/components/dashboard/StateSelector';
import { StateFilterProvider } from '@/contexts/StateFilterContext';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeseries', label: 'Time Series' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'insights', label: 'Analytical Insights' },
] as const;

type TabId = typeof tabs[number]['id'];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <StateFilterProvider>
    <div className="min-h-screen grid-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader />
        <ImportUSASpending />
        <StateSelector />



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
            <AnomalyChart />
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6 pb-12">
            <ComparisonPanel />
            <PercentChangeTable />
          </div>
        )}

        {/* Analytical Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6 pb-12">
            <AIInsightsPanel />
          </div>
        )}
      </div>
    </div>
    </StateFilterProvider>
  );
};

export default Index;
