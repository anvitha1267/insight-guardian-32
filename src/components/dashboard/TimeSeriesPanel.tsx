import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useSpendingData } from '@/hooks/useSpendingData';
import { Skeleton } from '@/components/ui/skeleton';

const PALETTE = [
  'hsl(220, 70%, 30%)',
  'hsl(0, 72%, 50%)',
  'hsl(35, 90%, 48%)',
  'hsl(145, 65%, 38%)',
  'hsl(250, 60%, 50%)',
  'hsl(200, 80%, 40%)',
  'hsl(20, 85%, 45%)',
  'hsl(280, 60%, 50%)',
  'hsl(170, 70%, 35%)',
  'hsl(50, 90%, 45%)',
  'hsl(320, 65%, 50%)',
  'hsl(110, 60%, 40%)',
  'hsl(15, 75%, 45%)',
  'hsl(180, 70%, 35%)',
];

const TimeSeriesPanel = () => {
  const { data: spendingData, isLoading } = useSpendingData();

  if (isLoading || !spendingData) {
    return <Skeleton className="h-[380px] rounded-lg" />;
  }

  const categories = [...new Set(spendingData.map(d => d.category))];
  const months = [...new Set(spendingData.map(d => d.date))];

  const chartData = months.map(month => {
    const row: Record<string, string | number> = { date: month };
    categories.forEach(cat => {
      const point = spendingData.find(d => d.date === month && d.category === cat);
      if (point) row[cat] = point.amount;
    });
    return row;
  });

  return (
    <div className="glass-panel rounded-lg p-6">
      <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-1">Time Series Analysis</h2>
      <p className="text-foreground font-heading text-lg mb-4">Federal Spending Across US States</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(220, 18%, 88%)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="hsl(220, 15%, 45%)" fontSize={11} fontFamily="JetBrains Mono" />
          <YAxis stroke="hsl(220, 15%, 45%)" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 18%, 88%)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: 11 }}
            formatter={(value: number) => [`$${(value / 1e6).toFixed(2)}M`, '']}
          />
          <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
          {categories.map((cat, i) => (
            <Line key={cat} type="monotone" dataKey={cat} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeSeriesPanel;
