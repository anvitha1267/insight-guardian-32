import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSpendingData, getCategorySummaries } from '@/hooks/useSpendingData';
import { Skeleton } from '@/components/ui/skeleton';

const PercentChangeTable = () => {
  const { data: spendingData, isLoading } = useSpendingData();

  if (isLoading || !spendingData) {
    return <Skeleton className="h-[300px] rounded-lg" />;
  }

  const summaries = getCategorySummaries(spendingData);

  return (
    <div className="glass-panel rounded-lg p-6">
      <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-1">Percent Change Analysis</h2>
      <p className="text-foreground font-heading text-lg mb-4">H2 vs H1 Comparison</p>
      <div className="space-y-3">
        {summaries.map(s => {
          const isUp = s.percentChange > 0;
          const isFlat = Math.abs(s.percentChange) < 1;
          return (
            <div key={s.category} className="flex items-center justify-between p-3 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${s.anomalyCount > 0 ? 'bg-anomaly animate-pulse-glow' : 'bg-primary'}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{s.category}</p>
                  <p className="text-xs text-muted-foreground font-mono">Avg: ${s.average.toLocaleString()}/mo · {s.anomalyCount} anomal{s.anomalyCount === 1 ? 'y' : 'ies'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`stat-value text-lg ${isFlat ? 'text-muted-foreground' : isUp ? 'text-warning' : 'text-success'}`}>
                  {isUp ? '+' : ''}{s.percentChange}%
                </span>
                {isFlat ? <Minus className="h-4 w-4 text-muted-foreground" /> :
                  isUp ? <TrendingUp className="h-4 w-4 text-warning" /> :
                  <TrendingDown className="h-4 w-4 text-success" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PercentChangeTable;
