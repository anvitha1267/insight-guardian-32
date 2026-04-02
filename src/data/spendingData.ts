export interface SpendingDataPoint {
  date: string;
  amount: number;
  category: string;
  isAnomaly: boolean;
  expected: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  average: number;
  anomalyCount: number;
  percentChange: number;
}

const categories = ['Marketing', 'Operations', 'Payroll', 'Software', 'Travel', 'Utilities'];

function generateMonthlyData(): SpendingDataPoint[] {
  const data: SpendingDataPoint[] = [];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const baselines: Record<string, number> = {
    Marketing: 45000,
    Operations: 32000,
    Payroll: 120000,
    Software: 18000,
    Travel: 12000,
    Utilities: 8000,
  };

  categories.forEach(cat => {
    const base = baselines[cat];
    months.forEach((month, i) => {
      const variance = (Math.random() - 0.5) * base * 0.2;
      let amount = base + variance + Math.sin(i / 2) * base * 0.1;
      const expected = base + Math.sin(i / 2) * base * 0.1;
      let isAnomaly = false;

      // Inject anomalies
      if (cat === 'Marketing' && month === 'Aug') {
        amount = base * 2.3;
        isAnomaly = true;
      }
      if (cat === 'Travel' && month === 'Nov') {
        amount = base * 3.1;
        isAnomaly = true;
      }
      if (cat === 'Software' && month === 'May') {
        amount = base * 2.8;
        isAnomaly = true;
      }
      if (cat === 'Operations' && month === 'Mar') {
        amount = base * 0.3;
        isAnomaly = true;
      }

      data.push({
        date: month,
        amount: Math.round(amount),
        category: cat,
        isAnomaly,
        expected: Math.round(expected),
      });
    });
  });

  return data;
}

export const spendingData = generateMonthlyData();

export const getTimeSeriesData = (category?: string) => {
  const filtered = category
    ? spendingData.filter(d => d.category === category)
    : spendingData;

  const grouped = filtered.reduce((acc, d) => {
    if (!acc[d.date]) acc[d.date] = { date: d.date, amount: 0, expected: 0, anomalyAmount: 0 };
    acc[d.date].amount += d.amount;
    acc[d.date].expected += d.expected;
    if (d.isAnomaly) acc[d.date].anomalyAmount += d.amount;
    return acc;
  }, {} as Record<string, { date: string; amount: number; expected: number; anomalyAmount: number }>);

  return Object.values(grouped);
};

export const getAnomalies = () => spendingData.filter(d => d.isAnomaly);

export const getCategorySummaries = (): CategorySummary[] => {
  return categories.map(cat => {
    const catData = spendingData.filter(d => d.category === cat);
    const total = catData.reduce((s, d) => s + d.amount, 0);
    const avg = total / catData.length;
    const anomalyCount = catData.filter(d => d.isAnomaly).length;

    const firstHalf = catData.slice(0, 6).reduce((s, d) => s + d.amount, 0);
    const secondHalf = catData.slice(6).reduce((s, d) => s + d.amount, 0);
    const percentChange = ((secondHalf - firstHalf) / firstHalf) * 100;

    return { category: cat, total, average: Math.round(avg), anomalyCount, percentChange: Math.round(percentChange * 10) / 10 };
  });
};

export const aiInsights = [
  {
    severity: 'critical' as const,
    title: 'Marketing Spend Spike Detected',
    description: 'August marketing expenditure was 130% above the rolling average. This correlates with the Q3 campaign launch but exceeds the allocated budget by $58,000.',
    recommendation: 'Review campaign ROI metrics and set automated budget alerts for future campaigns.',
  },
  {
    severity: 'warning' as const,
    title: 'Travel Costs Seasonal Anomaly',
    description: 'November travel spending is 210% above baseline. While Q4 conferences explain part of this, $24,000 in unclassified travel expenses require review.',
    recommendation: 'Implement pre-approval workflows for travel exceeding $5,000 per trip.',
  },
  {
    severity: 'info' as const,
    title: 'Software License Consolidation Opportunity',
    description: 'May showed a 180% spike in software costs due to overlapping SaaS subscriptions. Analysis shows 3 tools with redundant functionality.',
    recommendation: 'Consolidate duplicate tools to save an estimated $12,000/year.',
  },
  {
    severity: 'success' as const,
    title: 'Operations Cost Efficiency Improvement',
    description: 'March operations spending dropped 70% — investigation shows successful automation of manual processes saved $22,400.',
    recommendation: 'Document and replicate this automation pattern across other departments.',
  },
];
