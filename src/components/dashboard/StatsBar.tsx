import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { getAnomalies, getCategorySummaries, spendingData } from '@/data/spendingData';

const StatsBar = () => {
  const anomalies = getAnomalies();
  const summaries = getCategorySummaries();
  const totalSpend = summaries.reduce((s, c) => s + c.total, 0);
  const avgChange = summaries.reduce((s, c) => s + c.percentChange, 0) / summaries.length;

  const stats = [
    {
      label: 'Total Annual Spend',
      value: `$${(totalSpend / 1000000).toFixed(2)}M`,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: 'Anomalies Detected',
      value: anomalies.length.toString(),
      icon: AlertTriangle,
      color: 'text-anomaly',
    },
    {
      label: 'Avg H2/H1 Change',
      value: `${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}%`,
      icon: avgChange > 0 ? TrendingUp : TrendingDown,
      color: avgChange > 0 ? 'text-warning' : 'text-success',
    },
    {
      label: 'Categories Tracked',
      value: summaries.length.toString(),
      icon: DollarSign,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-panel rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <p className={`stat-value ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
