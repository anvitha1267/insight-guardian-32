import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpendingDataPoint {
  date: string;
  amount: number;
  category: string;
  is_anomaly: boolean;
  expected: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  average: number;
  anomalyCount: number;
  percentChange: number;
}

export interface AiInsight {
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  recommendation: string;
}

export const useSpendingData = () => {
  return useQuery({
    queryKey: ['spending-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spending_data')
        .select('date, amount, category, is_anomaly, expected');
      if (error) throw error;
      return data as SpendingDataPoint[];
    },
  });
};

export const useAiInsights = () => {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('severity, title, description, recommendation')
        .order('created_at');
      if (error) throw error;
      return data as AiInsight[];
    },
  });
};

// Derived data helpers
export const getAnomalies = (data: SpendingDataPoint[]) =>
  data.filter(d => d.is_anomaly);

export const getTimeSeriesData = (data: SpendingDataPoint[], category?: string) => {
  const filtered = category ? data.filter(d => d.category === category) : data;
  const grouped = filtered.reduce((acc, d) => {
    if (!acc[d.date]) acc[d.date] = { date: d.date, amount: 0, expected: 0, anomalyAmount: 0 };
    acc[d.date].amount += d.amount;
    acc[d.date].expected += d.expected;
    if (d.is_anomaly) acc[d.date].anomalyAmount += d.amount;
    return acc;
  }, {} as Record<string, { date: string; amount: number; expected: number; anomalyAmount: number }>);
  return Object.values(grouped);
};

export const getCategorySummaries = (data: SpendingDataPoint[]): CategorySummary[] => {
  const categories = [...new Set(data.map(d => d.category))];
  return categories.map(cat => {
    const catData = data.filter(d => d.category === cat);
    const total = catData.reduce((s, d) => s + d.amount, 0);
    const avg = total / catData.length;
    const anomalyCount = catData.filter(d => d.is_anomaly).length;
    const firstHalf = catData.slice(0, 6).reduce((s, d) => s + d.amount, 0);
    const secondHalf = catData.slice(6).reduce((s, d) => s + d.amount, 0);
    const percentChange = ((secondHalf - firstHalf) / firstHalf) * 100;
    return { category: cat, total, average: Math.round(avg), anomalyCount, percentChange: Math.round(percentChange * 10) / 10 };
  });
};
