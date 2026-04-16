import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useSpendingData } from '@/hooks/useSpendingData';
import { Skeleton } from '@/components/ui/skeleton';

const PALETTE = [
  'hsl(175, 80%, 50%)',
  'hsl(262, 70%, 60%)',
  'hsl(38, 92%, 55%)',
  'hsl(142, 70%, 45%)',
  'hsl(340, 82%, 58%)',
  'hsl(215, 85%, 60%)',
  'hsl(20, 85%, 60%)',
  'hsl(280, 70%, 65%)',
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
      <p className="text-foreground font-heading text-lg mb-4">Federal Agency Spending in Connecticut</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(222, 25%, 16%)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="hsl(215, 15%, 50%)" fontSize={11} fontFamily="JetBrains Mono" />
          <YAxis stroke="hsl(215, 15%, 50%)" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222, 44%, 9%)', border: '1px solid hsl(222, 25%, 16%)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: 11 }}
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
