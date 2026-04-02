import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSpendingData } from '@/hooks/useSpendingData';
import { Skeleton } from '@/components/ui/skeleton';

const ComparisonPanel = () => {
  const { data: spendingData, isLoading } = useSpendingData();
  const [catA, setCatA] = useState('Marketing');
  const [catB, setCatB] = useState('Operations');

  if (isLoading || !spendingData) {
    return <Skeleton className="h-[380px] rounded-lg" />;
  }

  const categories = [...new Set(spendingData.map(d => d.category))];
  const months = [...new Set(spendingData.map(d => d.date))];

  const chartData = months.map(month => {
    const a = spendingData.find(d => d.date === month && d.category === catA);
    const b = spendingData.find(d => d.date === month && d.category === catB);
    return { date: month, [catA]: a?.amount || 0, [catB]: b?.amount || 0 };
  });

  return (
    <div className="glass-panel rounded-lg p-6">
      <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-1">Category Comparison</h2>
      <div className="flex items-center gap-4 mb-4">
        <select value={catA} onChange={e => setCatA(e.target.value)} className="bg-muted text-foreground text-sm font-mono rounded-md px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-muted-foreground font-mono text-sm">vs</span>
        <select value={catB} onChange={e => setCatB(e.target.value)} className="bg-muted text-foreground text-sm font-mono rounded-md px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(222, 25%, 16%)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="hsl(215, 15%, 50%)" fontSize={11} fontFamily="JetBrains Mono" />
          <YAxis stroke="hsl(215, 15%, 50%)" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222, 44%, 9%)', border: '1px solid hsl(222, 25%, 16%)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: 11 }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Bar dataKey={catA} fill="hsl(175, 80%, 50%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey={catB} fill="hsl(262, 70%, 60%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-6 mt-3 text-xs font-mono">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />{catA}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-chart-5" />{catB}</span>
      </div>
    </div>
  );
};

export default ComparisonPanel;
