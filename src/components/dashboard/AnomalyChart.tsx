import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot,
} from 'recharts';
import { useSpendingData, getTimeSeriesData, getAnomalies } from '@/hooks/useSpendingData';
import { Skeleton } from '@/components/ui/skeleton';

const AnomalyChart = ({ category }: { category?: string }) => {
  const { data: spendingData, isLoading } = useSpendingData();

  if (isLoading || !spendingData) {
    return <Skeleton className="h-[400px] rounded-lg" />;
  }

  const data = getTimeSeriesData(spendingData, category);
  const anomalies = getAnomalies(spendingData).filter(a => !category || a.category === category);

  const anomalyDots = anomalies.reduce((acc, a) => {
    const point = data.find(d => d.date === a.date);
    if (point) acc.push({ date: a.date, amount: point.amount });
    return acc;
  }, [] as { date: string; amount: number }[]);

  return (
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground">Anomaly Detection</h2>
          <p className="text-foreground font-heading text-lg">{category || 'All Agencies'} — Spending vs Expected</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Actual</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Expected</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-anomaly animate-pulse-glow" /> Anomaly</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(222, 25%, 16%)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="hsl(215, 15%, 50%)" fontSize={11} fontFamily="JetBrains Mono" />
          <YAxis stroke="hsl(215, 15%, 50%)" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222, 44%, 9%)', border: '1px solid hsl(222, 25%, 16%)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: 12 }}
            formatter={(value: number) => [`$${(value / 1e6).toFixed(2)}M`, '']}
          />
          <Area type="monotone" dataKey="expected" stroke="hsl(215, 15%, 50%)" strokeDasharray="5 5" fillOpacity={0} strokeWidth={1.5} />
          <Area type="monotone" dataKey="amount" stroke="hsl(175, 80%, 50%)" fill="url(#gradientActual)" strokeWidth={2} />
          {anomalyDots.map((dot, i) => (
            <ReferenceDot key={i} x={dot.date} y={dot.amount} r={6} fill="hsl(340, 82%, 58%)" stroke="hsl(340, 82%, 58%)" strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnomalyChart;
